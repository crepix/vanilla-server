import express = require("express");
import path = require("path");
import config = require("config");
import {DEFAULT, TWITTER, SLACK} from "./options";
import {CronController} from "./CronController";
import getVanilla = require("./getVanillaInformation");
import {SlackBotProvider} from "./SlackBot";
let favicon = require("serve-favicon");
let logger = require("morgan");
let cookieParser = require("cookie-parser");
let bodyParser = require("body-parser");
let ECT = require("ect");
let ectRenderer = ECT({ watch: true, root: "views", ext : ".ect" });

import routes = require("./routes/index");

let app = express();

// view engine setup
app.engine("ect", ectRenderer.render);
app.set("view engine", "ect");

// uncomment after placing your favicon in /public
app.use(favicon(path.join("public", "favicon.ico")));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join("public")));

app.use("/", routes);

// catch 404 and forward to error handler
app.use(function(req: express.Request, res: express.Response, next: any) {
  var err = new Error("Not Found");
  err["status"] = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use(function(err: any, req: express.Request, res: express.Response, next: any) {
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err: any, req: express.Request, res: express.Response, next: any) {
  console.log(err)
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: {}
  });
});

if (config.get<string>("postTarget") === "slack") {
  const bot = SlackBotProvider.generate(config.get<string>("slack.token"), config.get<string[]>("slack.cronChannelIds"));
  bot.start();
}

const cronTime = config.get<string>("cron");
const option = config.get<string>("postTarget") === "slack" ? SLACK : DEFAULT;
const c = new CronController(cronTime, option);
c.start();
module.exports = app;
