#! /bin/sh
#$ -V
#$ -cwd
#$ -S /bin/bash
#$ -N VungTestJob
#$ -o $JOB_NAME.o$JOB_ID
#$ -e $JOB_NAME.e$JOB_ID
#$ -q omni
#$ -pe sm 36
#$ -P quanah
node parent.jsc