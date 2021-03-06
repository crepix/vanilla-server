"use strict";
import cron = require("cron");
import config = require("config");
import getVanilla = require("./getVanillaInformation");
import {DEFAULT, TWITTER, SLACK} from "./options";
import {SlackBotProvider} from "./SlackBot";

export class CronController {
  private cronJob: cron.CronJob;

  constructor(cronTime: string, option: number) {
    this.cronJob = new cron.CronJob({
      cronTime: cronTime,
      onTick: () => {
        getVanilla(option).then((info) => {
          console.log(info.name);
          console.log(info.text);
          console.log("");
          if (option === SLACK) {
            SlackBotProvider.get().sendMessageToAllCronChannel("*《" + info.name + "》*\n```\n" + info.text + "\n```");
          }
        });
      },
      onComplete: () => {
        console.log("onComplite!");
      },
      start: false,
      timeZone: "Asia/Tokyo"
    });
  }

  start(): void {
    console.log("cron start");
    this.cronJob.start();
  }

  stop(): void {
    this.cronJob.stop();
  }
}
