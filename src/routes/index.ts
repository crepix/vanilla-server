import express = require("express");
import getVanilla = require("../getVanillaInformation");
let router = express.Router();

/* GET home page. */
router.get("/", function(req: express.Request, res: express.Response) {
  res.render("index", { title: "Express" });
});

/**
 * GET info
 */
router.get("/info", function(req: express.Request, res: express.Response) {
  if (!req.query.keyword) return res.status(200).json({name: "error", text: "queryパラメータでキーワードを指定してください"});
  const keyword = decodeURI(req.query.keyword);
  getVanilla(null, keyword).then(param => {
    res.status(200).json(param);
  });
});

export = router;