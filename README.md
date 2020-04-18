# Drizzle Tutorial
This branch contains the files generated for the Drizzle tutorial
proposed by EatTheBlocks in this video: https://www.youtube.com/watch?v=QH_yLPYQEs4

This branch exist only to check the development environment
set up for the frontend development.

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

Note:
If this does not work, it might be that additional npm modules
installed by `create-react-app` are needed.
Try to create from scratch a new React app
dir and then copy in there the source .js files from this repo

## Drizzle object connection to React App
See the video at [20:45]

Normally the drizzle object needs to be manually connected to 
the React App, but we can use the wrapper component DrizzleProvider
to facilitate this step. DrizzleProvider is part of drizzle-react

## Drizzle connect()
See the video at [30:00]

Normally we would need to explicitly call the connect() function
to connect a Component to Redux store. Same is for Drizzle, but 
the connect function is provided by Drizzle itself.

See the drizzleConnect() function in Container.js and the mapStateToProps
map.

TODO: not clear if this is needed, because it is used only in Container.js
which is eventually removed from the project, need to check 

## Problem with the legacy context
From the warning on the console log it is visible that the connect()
funzion of the drizzle package uses legacy context API which will
be deprecated in the next major release of React (16.x will still support).

See https://reactjs.org/docs/legacy-context.html


