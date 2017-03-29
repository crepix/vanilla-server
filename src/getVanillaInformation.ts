"use strict";
import request = require("request-promise");
import {TWITTER} from "./options";
import Encoding = require("encoding-japanese");
const jschardet = require("jschardet");
const Iconv = require("iconv").Iconv;

/**
 * ランダムでバニラモンスターのモンスター情報を持ってきます。本体
 */
export = function getVanillaInformation(option?: number, tag?: string): Promise<{name: string, text: string}> {
  let rand = Math.floor(Math.random() * 65535) ;
  return selectUrl(rand, tag).then((url) => {
    return getNameAndText(url, option);
  }).then((output) => {
    return output;
  });
}

/**
 * 一覧のページからカードのURLを引っ張ってきます。返り値はPromise
 */
function selectUrl(num: number, tag?: string): Promise<string> {
  let t: string;
  if (tag) {
    let iconv = new Iconv("UTF-8", "EUC-JP//TRANSLIT//IGNORE");
    t = Encoding.urlEncode(iconv.convert(tag));
  } else {
    t = "%C4%CC%BE%EF%A5%E2%A5%F3%A5%B9%A5%BF%A1%BC";
  }
  return request("http://yugioh-wiki.net/index.php?cmd=taglist&tag=" + t, {encoding: null}).then((html: string) => {
    let detectResult = jschardet.detect(html);
    let iconv = new Iconv(detectResult.encoding, "UTF-8//TRANSLIT//IGNORE");
    let convertedString: string = iconv.convert(html).toString();
    let count = (convertedString.match(new RegExp("<li>", "g")) || []).length;
    if (count == 0) throw new Error("not_found");
    let link = convertedString.split("<li>")[num % count + 1].split('"')[1];
    return link;
  }).catch((err) => {
    console.log(err);
    return ""
  });
}

/**
 * URLからカードの名前とカードの情報を引っ張ってきます。返り値はPromise
 */
function getNameAndText(url: string, option?: number): Promise<{name: string, text: string}> {
  return request(url, {encoding: null}).then((html) => {
    let detectResult = jschardet.detect(html);
    let iconv = new Iconv(detectResult.encoding, "UTF-8//TRANSLIT//IGNORE");
    let convertedString: string = iconv.convert(html).toString();
    //let text = convertedString.split("<pre>")[1].split("</pre>")[0]
    //  .replace("ペンデュラム・通常モンスター", "").replace("通常モンスター", "").replace("Pendulum/Normal", "").replace("\n", "");
    let text = convertedString.split("<pre>")[1].split("</pre>")[0];
    let name = convertedString.split("title")[1].split("/title")[0].split("《")[1].split("》")[0];
    if(option === TWITTER) {
      if(text.replace(/\\/g, "").length + name.length + 1 > 140) {
        let pText = text.split("】")[1].split("【")[0];
        text = text.replace(pText, "");
      }
      if(text.replace(/\\/g, "").length + name.length + 1 > 140) {
        let pText = text.split("【")[1];
        text = text.replace(pText, "").replace("【モンスター情報】\n", "").replace("【", "");
      }
      if(text.replace(/\\/g, "").length + name.length + 1 > 140) {
        let cutNum = text.replace(/\\/g, "").length + name.length + 1 - 140
        text = text.slice(0, cutNum * -1);
      }
    }
    return {name: name, text: text};
  }).catch((err) => {
    return {name: "失敗", text: "エラーか該当するカードが見つかりませんでした……"}
  });
}
