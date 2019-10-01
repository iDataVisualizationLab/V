from keras.preprocessing import image
from keras.applications.vgg16 import VGG16
from keras.applications.vgg16 import preprocess_input
import numpy as np

import os
import json
import codecs

model = VGG16(weights='imagenet', include_top=False)

dirname = '../input/'

vgg16_feature_list = []
file_list = []

for idx, img_path in enumerate(os.listdir(dirname)):
    img = image.load_img(dirname + img_path, target_size=(224, 224))
    img_data = image.img_to_array(img)
    img_data = np.expand_dims(img_data, axis=0)
    img_data = preprocess_input(img_data)
    vgg16_feature = model.predict(img_data)
    vgg16_feature_np = np.array(vgg16_feature)
    vgg16_feature_list.append(vgg16_feature_np.flatten())
    file_list.append(img_path)
    
vgg16_feature_list_np = np.array(vgg16_feature_list)

file_path = "features.json"
json.dump(vgg16_feature_list_np.tolist(), codecs.open(file_path, 'w', encoding='utf-8'), separators=(',', ':'), sort_keys=True, indent=4) ### this saves the array in .json format

file_path = "files.json"
json.dump(file_list, codecs.open(file_path, 'w', encoding='utf-8'), separators=(',', ':'), sort_keys=True, indent=4) ### this saves the array in .json format