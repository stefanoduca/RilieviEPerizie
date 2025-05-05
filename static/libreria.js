"use strict";
const MAPS_URL = "https://maps.googleapis.com/maps/api/js"
const _URL=""
const MAP_KEY = "AIzaSyBZKYgxbiyRE7DknUpnRP2QHCBVjvLgH7g";

async function inviaRichiesta(method, url="", params={}) {
	method = method.toUpperCase()	
	let options = {
		"method": method,
		"headers":{},
		"mode": "cors",                  // default
		"cache": "no-cache",             // default
		"credentials": "same-origin",    // default
		"redirect": "follow",            // default
		"referrerPolicy": "no-referrer", // default no-referrer-when-downgrade
    }
	
	if(method=="GET") {
		const queryParams = new URLSearchParams();
		for (let key in params) {
			let value = params[key];
			// Notare che i parametri di tipo object vengono serializzati
			if (value && typeof value === "object")  
				queryParams.append(key, JSON.stringify(value));
			else 
				queryParams.append(key, value);
		}
		url += "?" + queryParams.toString()
		options.headers["Content-Type"]="application/x-www-form-urlencoded"
	}
	else {
		if(params instanceof FormData){   
			// In caso di formData occorre OMETTERE il Content-Type !
			// options.headers["Content-Type"]="multipart/form-data;" 
			options["body"]=params     // Accept FormData, File, Blob			
		}
		else{			
			options["body"] = JSON.stringify(params)
			options.headers["Content-Type"]="application/json";  
		}
	}
		
    try{
		const response = await fetch(_URL + url, options)	
		if (!response.ok) {
			let err = await response.text()
			return {"status":response.status, err}
		} 
		else{
		    let data = await response.json().catch(function(err){
				console.log(err)
				return {"status":422, "err":"Response contains an invalid json"}
		    })
			return {"status":200, data}
		}
    }
    catch{ 
	   return {"status":408, "err":"Connection Refused or Server timeout"}
	}
}
// utilizzo di un tag di caricamento diretto dello script
function caricaGoogleMaps() {
	let promise = new Promise(function (resolve, reject) {
	const script = document.createElement("script")
	script.type = "application/javascript"
	script.src = `${MAPS_URL}?v=3&key=${MAP_KEY}`
	document.body.appendChild(script)
	script.onerror = function () {
		console.log("Errore caricamento google map")
		reject(err)
	}
	script.onload = function () {
		resolve() 
	}
})
return promise
}

// dal 2024 l'indicazione della callback è diventata obbligatoria
function caricamentoEseguito() {
console.log("Google Maps caricate correttamente")
}

function caricaGoogleMapsDinamicamente() {
	(g => {
		let h, a, k,
			p = "The Google Maps JavaScript API",
			c = "google",
			l = "importLibrary",
			q = "__ib__",
			m = document,
			b = window;
		b = b[c] || (b[c] = {})
		let d = b.maps || (b.maps = {}),
			r = new Set,
			e = new URLSearchParams,
			u = () => h || (h = new Promise(async (f, n) => {
				await (a = m.createElement("script"));
				e.set("libraries", [...r] + "");
				for (k in g)
					e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
				e.set("callback", c + ".maps." + q);
				a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
				d[q] = f;
				a.onerror = () => h = n(Error(p + " could not load."));
				a.nonce = m.querySelector("script[nonce]")?.nonce || "";
				m.head.append(a);
			}))
		d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n))
	})
		({
			key: MAP_KEY,
			v: "weekly",
		})
}
