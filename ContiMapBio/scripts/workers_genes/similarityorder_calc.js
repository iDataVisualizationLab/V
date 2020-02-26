/**
 * Build the maximum path
 * @param data will have the format as [{'source': source, 'target': target, 'weight': similarity }, {}]
 */
function maximumPath(machines, links) {
    // Order the weights by ascending order.
    // if(HEAT_MAP){
    //     d3.shuffle(machines);
    //     return machines;
    // }
    if(NUM_OF_NEIGHBORS === 1){
        return machines;
    }
    return oneWayOrdering1(machines, links);
    // return oneWayOrdering2(machines, links);
    // return oneWayOrdering3(machines, links);
    // return twoWayOrdering(machines, links);
    // return nWayOrdering(machines, links);
}

function oneWayOrdering1(machines, links) {
    links.sort((a, b) => a.weight - b.weight);

    let machinesLength = machines.length;
    let sequence = [];
    let topLink = links[0];
    sequence.push(topLink.source);
    sequence.push(topLink.target);
    let prev = topLink.target;
    let expand;
    topLink.visited = true;
    let jumpCounter = 0;
    while (sequence.length !== machinesLength) {
        expand = links.find(l =>
            !l.visited &&
            (
                (l.source === prev && sequence.indexOf(l.target) < 0) ||
                (l.target === prev && sequence.indexOf(l.source) < 0)
            )
        );
        //Check here for this case: https://docs.google.com/spreadsheets/d/1prlex_kzODa8YFgnM2FwJwj_5ctJ1C2xm2FyGZq2sZM/edit#gid=0
        if (!expand) {
            jumpCounter++;
            //Next node
            let counter = 1;
            let indexOfPrev = machines.indexOf(prev);
            while (true) {
                let nextNode = machines[(indexOfPrev + counter) % machinesLength];
                if (sequence.indexOf(nextNode) < 0) {
                    sequence.push(nextNode);
                    prev = nextNode;
                    break;
                }
                if (indexOfPrev - counter >= 0) {
                    nextNode = machines[(indexOfPrev - counter) % machinesLength];
                    if (sequence.indexOf(nextNode) < 0) {
                        sequence.push(nextNode);
                        prev = nextNode;
                        break;
                    }
                }

                counter++;
            }

        } else {
            if (expand.source === prev) {
                sequence.push(expand.target);
                prev = expand.target;
            } else {
                sequence.push(expand.source);
                prev = expand.source;
            }
            expand.visited = true;
        }

    }
    // let sequence = machines;
    return sequence;
}

function oneWayOrdering2(machines, links) {
    let machineObject = {};
    machines.forEach(mc => {
        machineObject[mc] = [];
    });
    links.forEach(l => {
        machineObject[l.source].push({machine: l.target, weight: l.weight});
        machineObject[l.target].push({machine: l.source, weight: l.weight});
    });

    //Start from the first one.
    let sequence = [];
    //Start from the first machine
    sequence.push(machines[0]);
    let prev = machines[0];
    let machineRow;
    let minVal;
    while (sequence.length < machines.length) {
        //find the minimum next node
        machineRow = machineObject[prev];
        minVal = Number.MAX_SAFE_INTEGER;
        prev = null;
        for (let i = 0; i < machineRow.length; i++) {
            let mc = machineRow[i];
            if (minVal > mc.weight && sequence.indexOf(mc.machine) < 0) {
                minVal = mc.weight;
                prev = mc.machine;
            }
        }
        sequence.push(prev);
    }
    return sequence;
}

function oneWayOrdering3(machines, links) {
    let machineObject = {};
    machines.forEach(mc => {
        machineObject[mc] = [];
    });
    links.forEach(l => {
        machineObject[l.source].push({machine: l.target, weight: l.weight});
        machineObject[l.target].push({machine: l.source, weight: l.weight});
    });
    //We sort => then we only need to find the first one which is not in the sequence.
    machines.forEach(mc => {
        machineObject[mc].sort((a, b) => a.weight - b.weight);
    });
    //Start from the first one.
    let sequence = [];
    //Start from the first machine
    sequence.push(machines[0]);
    let prev = machines[0];
    let machinesLength = machines.length;
    while (sequence.length < machinesLength) {
        //find the minimum next node
        prev = machineObject[prev].find(mc => sequence.indexOf(mc.machine) < 0).machine;
        sequence.push(prev);
    }
    return sequence;
}

function twoWayOrdering(machines, links) {
    links.sort((a, b) => a.weight - b.weight);
    let sequence = [];
    let topLink = links[0];
    let left = topLink.source;
    let right = topLink.target;
    sequence.unshift(left);
    sequence.push(right);
    topLink.visited = true;
    let leftExpandValue = Number.POSITIVE_INFINITY;
    let rightExpandValue = Number.POSITIVE_INFINITY;
    let leftExpand = undefined;
    let rightExpand = undefined;
    while (true) {
        //TODO: Only calculate left expand value if it is positive infinity or the sequence already contains either source or target
        if (leftExpandValue === Number.POSITIVE_INFINITY || sequence.indexOf(leftExpand.source) >= 0 || sequence.indexOf(leftExpand.target) >= 0) {
            leftExpand = links.find(//Take the first element only since this is the highest
                l => !l.visited //must not be visited
                    && (
                        (l.source === left && sequence.indexOf(l.target) < 0) //continue from left as source and target is not in the sequence to avoid circle
                        || (l.target === left && sequence.indexOf(l.source) < 0) //continue from left as target and source is not in the sequence to avoid circle
                    ));
            if (leftExpand) {//If it is possible to expand on the left, check the weight of the first one (the one on top will be the highest one)
                leftExpandValue = leftExpand.weight;
            }
        }

        //TODO: Only calculate right expand value if it is positive infinity or the sequence already contains either source or target
        if (rightExpandValue === Number.POSITIVE_INFINITY || sequence.indexOf(rightExpand.source) >= 0 || sequence.indexOf(rightExpand.target) >= 0) {
            rightExpand = links.find(
                l => !l.visited //must not be visited
                    && (
                        (l.source === right && sequence.indexOf(l.target) < 0) //continue from right as source and target is not in the sequence to avoid circle
                        || (l.target === right && sequence.indexOf(l.source) < 0) //continue from right as target and source is not in the sequence to avoid circle
                    ));
            if (rightExpand) {//If it is possible to expand on the right, check the weight of the first one (the one on top will be the highest one)
                rightExpandValue = rightExpand.weight;
            }
        }

        //Choose the expansion direction (left or right, with lower weight).
        if (leftExpandValue < rightExpandValue) {
            //Expand on the left
            let l = leftExpand;
            l.visited = true;//Mark this node as visited
            if (l.source === left) {
                left = l.target;
            } else {
                left = l.source;
            }
            sequence.unshift(left);//Put it to the left
            //We expanded on the left so we need to set its expanded value to positive infinity to trigger recalculation of left expand
            leftExpandValue = Number.POSITIVE_INFINITY;
        } else {
            //Expand on the right
            let l = rightExpand;
            l.visited = true;//Mark this node as visited
            if (l.source === right) {
                right = l.target;
            } else {
                right = l.source;
            }
            sequence.push(right);//Put it to the right
            //We expanded on the right so we need to set its expanded value to positive infinity to trigger recalculation of right expand
            rightExpandValue = Number.POSITIVE_INFINITY;
        }

        //If all nodes are put then finish
        if (sequence.length === machines.length) {
            break;
        }
    }
    return sequence;
}

function nWayOrdering(machines, links) {
    links.sort((a, b) => a.weight - b.weight);
    let machinesLength = machines.length;
    let sequence = [];
    let lists = [];
    let currentNodes = [];

    for (let i = 0; i < links.length; i++) {
        let link = links[i];
        let source = link.source;
        let target = link.target;
        let added = false;
        for (let j = 0; j < lists.length; j++) {
            let list = lists[j];
            let addedNode = list.addLink(link, currentNodes);
            if (addedNode) {
                currentNodes.push(addedNode);
                added = true;
                break;
            }
        }
        //If can't add => can we join?
        //Clean the joined list.

        if (!added && (currentNodes.indexOf(source) < 0) && (currentNodes.indexOf(target) < 0)) { //Loop through all lists but can't add.
            //Create a new list.
            lists.push(new LinkedList(source, target));
            currentNodes.push(source);
            currentNodes.push(target);
        }
        if (currentNodes.length === machinesLength) {

            //Now start joining sequence by the best link
            if (sequence.length === machinesLength) {
                return sequence;
            }

            lists.forEach(list => {
                sequence = sequence.concat(list.traverse());
            });
            return sequence;
        }
    }

}

function joinTwoLists(list1, list2, link) {
    //Allways assign the result to list1.
    let hs = [link.head, link.source];
    if (hs.indexOf(list1.head.value) >= 0 && hs.indexOf(list2.head) >= 0) {
        //Join head1 to head2
        return [list1.reverseHeadTail().join(list2)];
    }
    if (hs.indexOf(list1.head.value) >= 0 && hs.indexOf(list2.tail) >= 0) {
        //Join tail 2 to head 1
        return [list2.join(list1)];
    }
    if (hs.indexOf(list1.tail.value) >= 0 && hs.indexOf(list2.head.value) >= 0) {
        //Join tail 1 to head 2.
        return [list1.join(list2)];
    }
    if (hs.indexOf(list1.tail.value) >= 0 && hs.indexOf(list2.tail.value)) {
        //Join tail 1 to tail2
        return [list1.join(list2.reverseHeadTail())];
    }
    return [list1, list2];
}

/**
 * This is a simple list with only basic condition checking for better performance
 */
class Node {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

class LinkedList {
    constructor(headV, tailV) {
        this.head = new Node(headV);
        this.tail = new Node(tailV);
        this.head.next = this.tail;
    }

    addLink(link, currentNodes) {//Add the link but the added node must not exist in the current node.
        let source = link.source;
        let target = link.target;
        if (this.head.value === source && currentNodes.indexOf(target) < 0) {
            this.addToHead(target);
            return target;
        } else if (this.head.value === target && currentNodes.indexOf(source) < 0) {
            this.addToHead(source);
            return source;
        } else if (this.tail.value === source && currentNodes.indexOf(target) < 0) {
            this.addToTail(target);
            return target;
        } else if (this.tail.value === target && currentNodes.indexOf(source) < 0) {
            this.addToTail(source);
            return source;
        }
        return null;
    }

    addToHead(nodeV) {
        let node = new Node(nodeV);
        node.next = this.head;
        this.head = node;
    }

    addToTail(nodeV) {
        let node = new Node(nodeV);
        this.tail.next = node;
        this.tail = node;
    }

    size() {
        let n = this.head;
        let counter = 1;
        while (n.next) {
            counter += 1;
            n = n.next;
        }
    }

    reverseHeadTail() {
        let allNodes = [];
        let n = this.head;
        allNodes.push(n);
        while (n = n.next) {
            allNodes.push(n);
        }
        //Reverse now.
        let nodeSize = allNodes.length;
        this.head = allNodes[nodeSize - 1];
        n = this.head;
        for (let i = nodeSize - 2; i >= 0; --i) {
            n.next = allNodes[i];
            n = n.next;
        }
        n.next = null;
        this.tail = n;
    }

    join(list2) {
        this.tail.next = list2.head;
        this.tail = list2.tail;
    }

    traverse() {
        let n = this.head;
        let result = [n.value];
        while (n = n.next) {
            result.push(n.value);
        }
        return result;
    }
}