// Entry point for the app

// Zupino's dependencies
import proxy from 'express-http-proxy';

// Express is the underlying that atlassian-connect-express uses:
// https://expressjs.com
import express from 'express';

// https://expressjs.com/en/guide/using-middleware.html
import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import morgan from 'morgan';

// atlassian-connect-express also provides a middleware
import ace from 'atlassian-connect-express';

// Use Handlebars as view engine:
// https://npmjs.org/package/express-hbs
// http://handlebarsjs.com
import hbs from 'express-hbs';

// We also need a few stock Node modules
import http from 'http';
import path from 'path';
import os from 'os';
import helmet from 'helmet';
import nocache from 'nocache';

// Routes live here; this is the C in MVC
import routes from './routes';

// TODO WS 1 require npm install http-proxy-middleware, and need
// to check if only 1 proxy solution can be used for both 
// normal redirect and websocket
const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Configure proxy middleware for websocket
 * TODO WS 2 also related to previous todo, better 1 proxy 
 * solution only
 */
const wsProxy = createProxyMiddleware('/ws-rpc', {
  target: 'ws://172.18.0.3:8546',
  // pathRewrite: {
  //  '^/websocket' : '/socket',        // rewrite path.
  //  '^/removepath' : ''               // remove path.
  // },
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  ws: true, // enable websocket proxy
  logLevel: 'debug',
});


// Bootstrap Express and atlassian-connect-express
const app = express();
const addon = ace(app);

// See config.json
const port = addon.config.port();
app.set('port', port);

// Configure Handlebars
const viewsDir = __dirname + '/views';
app.engine('hbs', hbs.express4({partialsDir: viewsDir}));
app.set('view engine', 'hbs');
app.set('views', viewsDir);

// Set the websocket proxy for this app
// TODO WS 3 same as 2 todo above, might need refactor
app.use(wsProxy);

// Set no-referrer header on all requests
app.use(function(req, res, next) {
    res.setHeader("Referrer-Policy", "origin");
    return next();
});

// Log requests, using an appropriate formatter by env
const devEnv = app.get('env') == 'development';
app.use(morgan(devEnv ? 'dev' : 'combined'));

// Atlassian security policy requirements
// http://go.atlassian.com/security-requirements-for-cloud-apps
// HSTS must be enabled with a minimum age of at least one year
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: false
}));
app.use(helmet.referrerPolicy({
  policy: ['origin-when-cross-origin']
}));

// Include request parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// Gzip responses when appropriate
app.use(compression());

// Include atlassian-connect-express middleware
app.use(addon.middleware());

// Mount the static files directory
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// try to get the Web3 provider connection through the same server
// by proxying RPC calls
// TODO might not be needed anymore as we add
// WS proxing support
app.use('/provider', proxy('http://172.18.0.3:8545'));


// Atlassian security policy requirements
// http://go.atlassian.com/security-requirements-for-cloud-apps
app.use(nocache());

// Show nicer errors in dev mode
if (devEnv) app.use(errorHandler());

// Wire up routes
routes(app, addon);

// Boot the HTTP server
http.createServer(app).listen(port, () => {
  console.log('App server running at http://' + os.hostname() + ':' + port);

  // Enables auto registration/de-registration of app into a host in dev mode
  if (devEnv) addon.register();
});
