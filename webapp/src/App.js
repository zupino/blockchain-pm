import React, { Component } from 'react';
import drizzleOptions from "./drizzleOptions.js";
import { LoadingContainer } from "drizzle-react-components";
import { DrizzleProvider } from "drizzle-react";
import './App.css';

import MyComponent from "./MyComponent";

function App() {
  return (
    <DrizzleProvider options={drizzleOptions}>
        <LoadingContainer>
            <MyComponent />
        </LoadingContainer>
    </DrizzleProvider>
  );
}

export default App;
