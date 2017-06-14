var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

/* GET home page. */
router.get('/', function(req, res, next){
	res.render("index.html");
});

router.get('/qso', function(req, res, next){
	var db = req.app.get('db');

	var match = {
		q: parse_match(req.query)
	};

	console.log(match);

	find_qso(db, match, function(err, d){
		if(d.length == 1){
			res.render("view.html", d[0]);
		}else if(d.length > 1){
			res.render("search.html", {
				results: d,
				q: match
			});
		}else{
			res.render("error.html", {
				message: "No Samples Found",
				error: "No samples fit your given query."
			});
		}
	});
});

router.get('/search', function(req, res, next){
	var db = req.app.get('db');
	getKeys(db, function(err, keys){
		res.render("search_form.html", {
			keys: keys
		});
	});
});

router.post('/qso', function(req, res, next){
	var db = req.app.get('db');

	if(req.body.q){
		find_qso(db, req.body, function(err, data){
			if(err){
				res.send(err);
			}else{
				res.send(data);
			}
		});
	}else{
		res.send({
			message: "Invalid Query",
			error: "Invalid Query"
		});
	}
});

function parse_match(match){
	Object.keys(match).forEach(function(k){
		var t = Number(match[k]);

		if(isNaN(t)){
			if(isJson(match[k])){
				match[k] = JSON.parse(match[k]);
			}
		}else{
			match[k] = t;
		}
	});

	return match;
}

function find_qso(db, req, callback){
	var match = req.q;
	var sort = req.sort || {};

	db.collection('qso_vac').find(
		match
	).sort(sort).toArray(function(err, d){
		if(!err){
			d.forEach(function(d){
				Object.keys(d).forEach(function(k){
					//Redact properties
					delete d[k].SID;
					delete d[k]._id;
					delete d[k].file;
				});
			});
		}

		callback(err, d);
	});
}

function isJson(str){
    try {
        JSON.parse(str);
    }catch(e){
        return false;
    }

    return true;
}

function getKeys(db, callback){
	db.collection('qso_vac').findOne(
		{
			dr7q: {$exists: true},
			BAL: {$exists: true
		}
	}, function(err, data){
		var keys = [];

		Object.keys(data).forEach(function(k){
        	if(typeof data[k] === "object" && data[k] !== null && k != "_id"){
            	Object.keys(data[k]).forEach(function(v){
                	if(v != "_id"){
                    	keys.push(k + "." + v);
                	}
            	});
        	}
    	});

    	callback(err, keys);
	});
}

module.exports = router;