const fetch = require("node-fetch");

async function getAddressFromOSM(comune, istat, via, numero, cap) {
	
 	var newArr = [];
 	var counts = {};
 	var result = [];
  const url = 'https://overpass-api.de/api/interpreter?';

  try {

    //Query Overpass che restitutisce CAP se esiste in mappa OSM e valida il numero civico
    var option = '[out:json];'+
                 'area[name="'+comune+'"]["ref:ISTAT"="'+istat+'"]->.a;'+
                 'node(area.a)'+            
                 '["addr:street"="'+via+'"]'+
                 '["addr:housenumber"="'+numero+'"]'+
                 '["addr:postcode"="'+cap+'"];'+
                 '(._;>;);out body;'
                 	
    console.debug('OPTION1: ',option)    

    const data = await fetch(url, 
                          {
                            method: 'POST',
                            headers: {'Accept': 'application/json',
                                      "Content-Type": "application/json"},
                            body: option
                          })
                          .then(function(result) {
                                  //console.debug("RESULT -> : ",result);
                                  return result.json();
                          });

      var objData = await data

      //console.debug("OVERPASS DATA 1° Query -> ", objData.elements);

      for (var index = 0; index < objData.elements.length; ++index) {          
        if ( objData.elements[index].tags["addr:postcode"] !=="" ) {
            newArr.push(objData.elements[index]);
        }
      }
    	//console.debug('ARRAY da 1° Query: ',newArr);

    	if (newArr.length == 1 && newArr[0].tags['addr:postcode'] !=='' ) {
    		if (newArr[0].tags['addr:postcode'] == undefined ) newArr[0].tags['addr:postcode'] = ''
    		result = 	{ 'comune': comune,
    								'istat' : istat,
    								'via'		: via,
    								'numero': numero,
    								'cap'		: newArr[0].tags['addr:postcode'],
    								'lat'		: newArr[0].lat,
    								'lon'		: newArr[0].lon,
    								'status': 'valido',
    								'desStatus' : 'Indirizzo corretto'
    							}
    		console.debug('RESULT 1:',result)
    	} else if (newArr.length > 1 ) {
      	//--------------------------------------------------------------
        // determino per prevalenza il cap di quella via per quel numero
        //--------------------------------------------------------------        				
	      newArr.forEach(	function (x) {counts[x.tags["addr:postcode"]] = (counts[x.tags["addr:postcode"]] || 0) + 1;});
				var vcap = '';
				var vMax = 0;
				var stato = '';
				var dsc = '';
				//counts = { '20122': 1, '20124': 1, '20126': 2 } //per Test

				console.debug('CONTA JSON = ',counts)
				for(var i in counts) {
		    	result.push([i, counts[i]]);
		      if (i!=='' && i!==undefined && counts[i] > vMax) { 
		      	vcap=i; vMax=counts[i];
		      } else if (counts[i] == vMax) { 
		      	vcap='';
			    }
		    }		    
		    console.debug('vCap=',vcap,' vMax=',vMax)

		    if (vcap == cap) {
		    	stato = 'valido';
		    	dsc = 'Indirizzo corretto';
		    } else {
		    	stato = 'verificare';
		    	dsc = 'Cap inserito diverso da quello ricercato';
		    }

		    result = 	{ 'comune': comune,
    								'istat' : istat,
    								'via'		: via,
    								'numero': numero,
    								'cap'		: cap,
    								'lat'		: newArr[0].lat,
    								'lon'		: newArr[0].lon,
    								'status': stato,
    								'desStatus' : dsc
    							}
    		console.debug('RESULT:',result)
//==================================================================================
// INIZIO PARTE IN CUI OVERPASS deduce CAP dalla città
// caso in cui la query precedente risponde con un valore nullo    		
//==================================================================================
		  } else if (newArr.length == 0 ) {
		  	//--------------------------------------------------------------
		  	// determino il cap andando a ricercarlo come città
		  	//--------------------------------------------------------------
		  	var option = '[out:json];'+
		                 'area[name="'+comune+'"]["ref:ISTAT"="'+istat+'"]->.a;'+
		                 'node(area.a)'+            
		                 '["addr:city"="'+comune+'"];'+
		                 '(._;>;);out body;'

		    console.debug('OPTION_DEDUCO CAP: ',option)    

    		const data = await fetch(url, 
                          {
                            method: 'POST',
                            headers: {'Accept': 'application/json',
                                      "Content-Type": "application/json"},
                            body: option
                          })
                          .then(function(result) {
                                  //console.debug("RESULT -> : ",result);
                                  return result.json();
                          });
      	var objData = await data

      	//creo nuova array scartando i record con CAP nulli
      	for (var index = 0; index < objData.elements.length; ++index) {          
	        if ( objData.elements[index].tags["addr:postcode"] !== "" ) {
	            newArr.push(objData.elements[index]);
	        }
	      }	      
	      newArr.forEach(	function (x) {counts[x.tags["addr:postcode"]] = (counts[x.tags["addr:postcode"]] || 0) + 1;});      	

      	//--------------------------------------------------------------
        // determino per prevalenza il cap di quella città:
        //--------------------------------------------------------------  
				var vcap = '';
				var vMax = 0;
				var c = 0;
				var stato = '';
				var dsc = '';

				//conto per ciascun CAP trovato quanto ce ne sono
				for(var i in counts) {		    			    	
		      if (i!==undefined && i!=='' && counts[i] > vMax) { 
		      	vcap=i; vMax=counts[i];
		      	result.push([i, counts[i]]);
		      } else if (counts[i] == vMax) { 
		      	vcap='';
			    }
		    }		    
		    console.debug('Array = ',result)
		    //-------------------------------------------------------------
		    // condizione che mi dice se il CAP può essere considerato valido 
		    // è che l'array abbia un solo elemento e quindi 1 solo CAP
		    //-------------------------------------------------------------
        vcap = (result.length == 1) ? vcap : '';

        //====================================================================
        // determino la longitudine, latitudine del centro della via
        //====================================================================
        var vlat = 0;
        var vlon = 0;
        var option = '[out:json];'+
		                 'area[name="'+comune+'"]["ref:ISTAT"="'+istat+'"]->.a;'+
		                 'way(area.a)'+            
		                 '["name"="'+via+'"];'+
		                 'out center;'

		    console.debug('OPTION_LAT_LON: ',option)    

    		const datac = await fetch(url, 
                          {
                            method: 'POST',
                            headers: {'Accept': 'application/json',
                                      "Content-Type": "application/json"},
                            body: option
                          })
                          .then(function(result) {
                                  //console.debug("RESULT -> : ",result);
                                  return result.json();
                          });

      	var objData = await datac;

      	if (objData.elements.length > 0) {
      		vlat = objData.elements[0].center["lat"]
      		vlon = objData.elements[0].center["lon"]
      	}      		


      	//console.debug("OVERPASS DATA 3° Query -> ", objData.elements);


      	//========================= RISULTATO =============================

      	if (vcap==cap && vlon!==0 && vlat!==0) {
		    	stato = 'verificare';
		    	dsc = 'Verificare il numero civico ';
		    } else if (vcap=='' && vlon!==0 && vlat!==0 ) {
		    	stato = 'verificare';
		    	dsc = 'Cap inserito diverso da quello ricercato e non trovato';
		    } else if (vcap==cap && vlon==0 && vlat==0 ) {
		    	stato = 'verificare';
		    	dsc = 'Lat e Lon  non trovati';
		    }	else {
		    	stato = 'verificare';
		    	dsc = 'Cap inserito diverso da quello ricercato ';
		    };
		    console.debug('Cap=',vcap,' vMax=',vMax);
		    result = 	{ 'comune': comune,
    								'istat' : istat,
    								'via'		: via,
    								'numero': numero,
    								'cap'		: cap,
    								'lat'		: vlat,
    								'lon'		: vlon,
    								'status': stato,
    								'desStatus' : dsc
    							}
    		console.debug('RESULT:',result);
		  }
		
		  return result;
		
		} catch (e) {
			console.error('ERRORE in overpassQuery',e);		
			throw({ errCode: 500, errMsg: 'Overpass KO' });
			result = 	{'status':'ko',
									'desStatus' : 'Errore in OverpassQuery'
								};
			return result;
		}

	};

module.exports = { getAddressFromOSM };