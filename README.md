# Drizzle Tutorial
This branch contains the files generated for the Drizzle tutorial
proposed by EatTheBlocks in this video: https://www.youtube.com/watch?v=QH_yLPYQEs4

The files are prepared for a quick boostrat without the need to type all the code
from the video, for a quick check of the environment

There are few notes that were taken during the walk through:

## Dependencies
Truffle and Create React App cli are both needed for this tutorial, if you do not have
those installed, install them first with the following commands

`npm install -g truffle`
`npm install -g create-react-app`

Normally you would create the React app dir with the command 
`create-react-app app --use-npm` but this has already being done
and the `app/` dir is already part of this repo.

What is missing are the Drizzle npm packages, which need to be
installed by entering the `app/` dir and installing them with npm:

`npm install drizzle drizzle-react drizzle-react-components`

This should add the `node_modules` dir in the `app/` and make the 
entire project dir ready.
