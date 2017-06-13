var db = connect("localhost:27017/qso_data");

//Search range
var delta = 0.01;

//Get count of entries
var total = db.dr9q.count();
var current = 0;

//Start in dr9q collection. Select RA, DEC
db.dr9q.find().forEach(function(data){
	var full_data = {
		SID: data.SID || data.PLATE + "-" + data.MJD + "-" + data.FIBERID,
		dr9q: data
	};

	//Calculate RA, DEC limits
	var RA_max = data.RA + delta;
	var RA_min = data.RA - delta;
	var DEC_max = data.DEC + delta;
	var DEC_min = data.DEC - delta;

	var RA = data.RA;
	var DEC = data.DEC;

	var match = {
		$match: {
			$and: [
				{RA: {$gt: RA_min}},
				{RA: {$lt: RA_max}},
				{DEC: {$gt: DEC_min}},
				{DEC: {$lt: DEC_max}}
			]
		}
	};

	//Find in shen_dr7
	var dr7q = db.dr7q.find({
		PLATE: data.PLATE_DR7,
		MJD: data.MJD_DR7,
		FIBER: data.FIBERID_DR7
	}).toArray();

	if(dr7q.length != 0){
		full_data.dr7q = dr7q[0];
	}

	//Find in abs data
	var BAL = db.BAL_1000.find({SID: data.SID}).toArray();
	
	if(BAL.length != 0){
		full_data.BAL = BAL[0];
	}

	db.qso_vac.update(
		{SID: data.SID},
		full_data,
		{upsert: true}
	);

	current++;
	print((current/total)*100 + "% Complete");
});