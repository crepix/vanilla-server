import getVanilla = require("./getVanillaInformation");
import {SLACK} from "./options";
const RTM_EVENTS = require("@slack/client").RTM_EVENTS;
const CLIENT_EVENTS = require("@slack/client").CLIENT_EVENTS;
const RtmClient = require("@slack/client").RtmClient;

interface Message {
  type: string,
  channel: string,
  user: string,
  text: string,
  ts: string,
  team: string
}


/**
 * クライアントを使いまわす場合はこっちを使う
 */
export class SlackBotProvider {
  static client: SlackBot;

  static generate(token: string, cronIds?: string[]): SlackBot {
    this.client = new SlackBot(token, cronIds);
    return this.client;
  }

  static get(): SlackBot {
    if (!this.client) return null;
    return this.client;
  }
}

/**
 * startすると、vanilla_botがjoinしているチャンネルでリプを飛ばすとなんか答えてくれるよ
 */
export class SlackBot {

  private _rtm: any;
  private _started: boolean;
  private _id: string;
  private _cronChannelIds: string[];
  private _cronKeywordMap: Map<string, string>;

  constructor(token: string, cronIds?: string[]) {
    this._started = false;
    this._cronChannelIds = cronIds ? cronIds : [];
    this._rtm = new RtmClient(token, {logLevel: "info"});
    this._cronKeywordMap = new Map();
  }

  start(): void {
    let that = this;
    this._rtm.start();
    this._rtm.on(RTM_EVENTS.MESSAGE, function (message) {
      that._reply(message);
    });
    this._rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
      that._started = true;
      console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
      that._id = rtmStartData.self.id;
    });
  }

  sendMessage(message: string, chennelId: string): void {
    if (!this._started) {
      console.log("not_connected");
      return;
    }
    this._rtm.sendMessage(message, chennelId);
  }

  // cronIdに登録されているチャンネル全部にメッセージを送る
  sendMessageToAllCronChannel(): void {
    this._cronChannelIds.forEach(channel => {
      if (this._cronKeywordMap.has(channel)) {
        getVanilla(SLACK, this._cronKeywordMap.get(channel)).then(info => {
          this.sendMessage("*《" + info.name + "》*\n" + "```\n" + info.text + "\n```\n" + info.url, channel);
        });
      } else {
        getVanilla(SLACK).then(info => {
          this.sendMessage("*《" + info.name + "》*\n" + "```\n" + info.text + "\n```\n" + info.url, channel);
        });
      }
    });
  }

  /**
   * @botName: ping: pongを返す
   * @botName: なんか: なんかに対応するカードを返す
   * @botName: 今日の最強カード: 完全藍弾で返す
   * @botName: {空白}: 通常モンスターを返す
   * @botName: help: コマンド一覧
   * @botName: add: 対応チャンネルでcronを始める
   * @botName: rule {任意の文字列}: 対応チャンネルのキーワードを変更する
   * @botName: remove: cronをやめる
   */
  private _reply(message: Message) {
    const botName = `<@${this._id}>`;
    if ( typeof message.text === "string" && message.text.indexOf(botName) !== -1) {
      const reply = message.text.split(botName)[1];
      if (reply.startsWith(" rule ")) {
        this._cronKeywordMap.set(message.channel, reply.split(" rule ")[1]);
        this.sendMessage("このチャンネルの定期POSTは `" + reply.split(" rule ")[1] + "` で行われるようになったよー", message.channel);
      } else {
        switch(reply) {
          case " ping":
            this.sendMessage("pong", message.channel);
            break;
          case " help":
            getVanilla(SLACK).then(info => {
              const mes =
                "空リプ: 通常モンスターをランダムに返します\n" +
                "攻1000、通常魔法、永続罠などのキーワード: 対応するカードをランダムに返します\n" +
                "今日の最強カード: 全てのカードからランダムに返します\n" +
                "ping: pongを返します\n" +
                "help: 有効なメッセージ一覧を表示します\n" +
                "add: このチャンネルを定期POSTの対象に加えます\n" +
                "rule {任意のキーワード}: このチャンネルが定期POSTの対象だった場合、定期POSTをキーワードで行います\n" +
                "show rule: このチャンネルの定期POSTをキーワードを表示します\n" +
                "remove rule: このチャンネルの定期POSTをキーワードを消します\n" +
                "remove: このチャンネルを定期POSTの対象から外します";
              this.sendMessage(mes, message.channel);
            });
            break;
          case " add":
            let isExist = this._cronChannelIds.indexOf(message.channel) >= 0;
            if (isExist) {
              this.sendMessage("もうこのチャンネルは加わってるよー", message.channel);
            } else {
              this._cronChannelIds.push(message.channel);
              this.sendMessage("このチャンネルを定期POSTの対象に加えたよー", message.channel);
            }
            break;
          case " show rule":
            if (this._cronKeywordMap.has(message.channel)) {
              this.sendMessage("このチャンネルの定期POSTは `" + this._cronKeywordMap.get(message.channel) + "` で行われるよー", message.channel);
            } else {
              this.sendMessage("このチャンネルには定期POST用のルールはないみたい", message.channel);
            }
            break;
          case " remove rule":
            if (this._cronKeywordMap.has(message.channel)) {
              this._cronKeywordMap.delete(message.channel);
              this.sendMessage("このチャンネルの定期POST用のルールはなくなったよー", message.channel);
            } else {
              this.sendMessage("このチャンネルには定期POST用のルールはないみたい", message.channel);
            }
            break;
          case " remove":
            let ise = this._cronChannelIds.indexOf(message.channel) >= 0;
            if (ise) {
              this._cronChannelIds = this._cronChannelIds.filter(channel => {
                return channel !== message.channel;
              })
              this.sendMessage("このチャンネルを定期POSTの対象から外したよー", message.channel);
            } else {
              this.sendMessage("このチャンネルは定期POSTの対象にはなってないみたい", message.channel);
            }
            break;
          case " 今日の最強カード":
            getVanilla(SLACK, "モンスター+魔法+罠").then(info => {
              this.sendMessage("*《" + info.name + "》*\n" + "```\n" + info.text + "\n```\n" + info.url, message.channel);
            });
            break;
          case "":
            getVanilla(SLACK).then(info => {
              this.sendMessage("*《" + info.name + "》*\n" + "```\n" + info.text + "\n```\n" + info.url, message.channel);
            });
            break;
          default:
            // 検索時に`－`は`−`に置き換える必要がある
            getVanilla(SLACK, reply.substr(1).replace("－", "−")).then(info => {
              this.sendMessage("*《" + info.name + "》*\n" + "```\n" + info.text + "\n```\n" + info.url, message.channel);
            });
        }
      }
    }
  }
}