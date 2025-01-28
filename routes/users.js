var express = require('express');
var router = express.Router();
const app = express();
const session = require('express-session');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.get('/admin', function (req, res, next) {  
  res.render("admin");
});

module.exports = router;
