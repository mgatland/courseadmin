"use strict"

const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const fs = require('fs')

var signupTemplate = {}
fs.readFile('./templates/signup.html', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  signupTemplate.html = data
  signupTemplate.plainText = convertToPlainText(data)
});

app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.post('/signup', function (req, res) {
	var signup = {}
	signup.course = req.body.course
	signup.name = req.body.name
	signup.email = req.body.email
	signup.phone = req.body.phone
	signup.canBringLaptop = req.body.canBringLaptop
	signup.time = new Date()
	var info = {
		to:signup.email,
		name:signup.name
	}
	console.log(signup)
	sendEmail(info, signupTemplate)
})

app.use(function (req, res, next) {
  res.status(404).send("Error 404 - file not found")
})

app.listen(3000, function () {
  console.log('App listening on port 3000!')
})

var sendEmail;
var sendgrid_api_key = process.env.sendgrid_api_key;

if (sendgrid_api_key) {
    var sendEmail = function (info, template) {
    	console.log(info)
			var helper = require('sendgrid').mail;
			var from_email = new helper.Email('noreply@girlcode.co.nz', "Girl Code");
			var to_email = new helper.Email(info.to);
			var subject = 'Girl Code – you have signed up!';
			var content = new helper.Content('text/plain', fillTemplate(template.plainText, info));
			var mail = new helper.Mail(from_email, subject, to_email, content);
  		content = new helper.Content("text/html", fillTemplate(template.html, info))
  		mail.addContent(content)

			var replyTo = new helper.Email("girlcodeakl@gmail.com", "Girl Code")
  		mail.setReplyTo(replyTo)

			var mail_settings = new helper.MailSettings()
			var bcc = new helper.Bcc(true, "girlcodeakl@gmail.com")
			mail_settings.setBcc(bcc)
			mail.addMailSettings(mail_settings)


			var sg = require('sendgrid')(sendgrid_api_key);
			var request = sg.emptyRequest({
			  method: 'POST',
			  path: '/v3/mail/send',
			  body: mail.toJSON(),
			});

			sg.API(request, function(error, response) {
			  console.log(response.statusCode);
			  console.log(response.body);
			  //console.log(response.headers);
			});

    }
} else {
    sendEmail = function (info, template) {
    	console.log(info)
      console.log("(email is disabled)");
    }
}

function fillTemplate(string, info) {
	for (var key in info) {
		console.log("Replacing " + key)
		string = string.replace(new RegExp('\\$'+key+'\\$', 'g'), info[key]);
	}
	return string
}

function convertToPlainText(html) {
	var str=html.replace(/[\r\n]\s*/g, ''); //remove initial newlines
	str=str.replace(/<div[^>]*>/gi, "\n");
	str=str.replace(/<\/div>>/gi, "\n");
	str=str.replace(/^\s+|\s+$/gm, ''); //remove whitespace at start of lines
	str=str.replace(/<(?:.|\s)*?>/g, ""); //remove other html
	//take out excess newlines
	//str=str.replace(/[\r\n]\s*/g, '\n\n');
	return str
}