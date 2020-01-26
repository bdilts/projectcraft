this._map = function () {
	let This = this;
	let canvas = document.getElementById("mapCanvas");
	let ctx = canvas.getContext("2d");
	let mapHolder = document.getElementById("mapHolder");
	let clickboxes = [];

	//The factor for the overworld is 4, the factor for the nether is 1.
	let factor = 1;

	this.settings = {
		maxZoom: 10,
		zoomStepSize: 1,
		animationSpeed: 0
	}

	//Initialize function.
	this.init = function (_points, _factor) {
		factor = _factor;
        
		for (i = 0; i < _points.length; i++) {
			registerPoint(_points[i]);
		}
        
		this.panToItem(_points[0]);
        
        document.getElementById("mapCanvas").addEventListener("click", function (e) {
        	let coords = Map.DOMToMC(eventToCoords(e));
        	
        	Map.handleClick(coords.x, coords.z);
        });

        document.getElementById("mapCanvas").addEventListener("mousemove", function (e) {
        	let coords = Map.DOMToMC(eventToCoords(e));
        	
        	document.getElementById("current_x").innerHTML = Math.round(coords.x);
        	document.getElementById("current_z").innerHTML = Math.round(coords.z);
        });

        function eventToCoords(_e) {
        	let mouseXPerc = (_e.x + mapHolder.scrollLeft) / (mapHolder.scrollWidth - 390 * InfoMenu.openState);
        	let mouseZPerc = (_e.y + mapHolder.scrollTop) / mapHolder.scrollHeight;

        	return {
        		x: mouseXPerc * canvas.width,
        		z: mouseZPerc * canvas.height
        	}
        }
        
        document.addEventListener("keydown", function (_e) {
        	if (_e.key == "+")
        		Map.zoomIn();
        	if (_e.key == "_")
        		Map.zoomOut();
        	if (_e.key == "+" || _e.key == "_")
        		_e.preventDefault();
        });
	}

	function registerPoint(_point) {
		let coords = This.MCToDOM(_point.coords);

		let username = "ddrl46";
		if (_point.builders && _point.builders.length == 1)
			username = _point.builders;
		if (_point.builders && _point.builders.length > 1)
			username = "MHF_Chest";
		if (_point.customHead)
			username = _point.customHead;

		let colour = "#006bed";
		if (_point.type.name == "Farm")
			colour = "#8200ed";
		if (_point.customPin)
			colour = _point.customPin;
		
        drawPoint(coords.x, coords.z, _point.type.radius, username, colour, _point.displayPoint);

		if (_point.clickable == false || _point.displayPoint === false) return;

		clickboxes.push({
            point: 	_point,
			x: 		_point.coords.x - 24,
			z: 		_point.coords.z - 60,
			rx: 	_point.coords.x + 24,
			rz: 	_point.coords.z
		});
	}

	function drawPoint(x, z, radius, username, colour, display) {
		let r = 20;
		ctx.fillStyle = "white";
		ctx.strokeStyle = "white";
		ctx.lineWidth = 2;

		if (radius) {
			ctx.beginPath();
			ctx.strokeStyle = colour;
			ctx.fillStyle = colour;
			ctx.arc(x, z, radius / 4, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.globalAlpha = 0.2;
			ctx.fill();
			ctx.globalAlpha = 1;
		}
        
        if (display === false) return;

		let img = new Image();
		img.onload = function () {
			ctx.drawImage(img, x - 16, z - 56, 32, 32);
		};
        
		img.src = "PHP/heads.php?type=head&scale=2&username=" + username;        
        
		ctx.fillStyle = "white";
		ctx.beginPath();
		ctx.moveTo(x, z);
		ctx.lineTo(x - r, z - 2 * r - 1);
		ctx.lineTo(x, z - 2 * r - 1);
		ctx.fill();

		let grd = ctx.createLinearGradient(x, z - 2 * r - 1, x + 0.5 * r, z);
		grd.addColorStop(0, "white")
		grd.addColorStop(1, "#aaa");
		ctx.fillStyle = grd;
		ctx.beginPath();
		ctx.moveTo(x, z);
		ctx.lineTo(x + r, z - 2 * r - 1);
		ctx.lineTo(x, z - 2 * r - 1);
		ctx.fill();

		let grd2 = ctx.createLinearGradient(x - r, z - r, x + r, z + r);
		grd2.addColorStop(0, colour);

		grd2.addColorStop(1, "#030303");
		ctx.fillStyle = grd2;
		ctx.beginPath();
		ctx.arc(x, z - 2 * r, r, 0, 2 * Math.PI);
		ctx.fill();
		ctx.fillStyle = "#ffffff";
		ctx.textAlign = "center";
	}

	this.drawLine = function(startX, startZ, endX, endZ, colour) {
		ctx.fillStyle = "white";
		ctx.strokeStyle = "white";
		if (colour)
			ctx.strokeStyle = colour;
		ctx.lineWidth = 3;

		ctx.beginPath();
		ctx.moveTo(this.MCToDOM(startX), this.MCToDOM(startZ));
		ctx.lineTo(this.MCToDOM(endX), this.MCToDOM(endZ));
		ctx.stroke();
	}

	this.MCToDOM = function(_mc) {
		return {
			x: (_mc.x - World.x) / factor,
			z: (_mc.z - World.z) / factor,
		}
	}

	this.DOMToMC = function(_dom) {
		return {
			x: _dom.x * factor + World.x,
			z: _dom.z * factor + World.z,
		}
	}

	this.DOMPanTo = function (_x, _z) { // canvas coords
		let x = _x / canvas.width * canvas.offsetWidth - $("#mapHolder")[0].offsetWidth / 2;
		let z = _z / canvas.height * canvas.offsetHeight - $("#mapHolder")[0].offsetHeight / 2;

		$("#mapHolder").animate({
			scrollLeft: x + "px",
			scrollTop: z + "px"
		}, 500);
	}

	this.handleClick = function (_x, _z) {
		let box = this.findClickbox(_x, _z);
		if (box == null) return;

        this.onItemClick(box.point);

		if (this.zoomPercentage <= 1.5) this.zoom(2);

		this.DOMPanTo(_x, _z);
	}
    
    //Handler code for page-specific execution.
    this.onItemClick = function() {};

	this.panToItem = function(_point) {
		if (this.zoomPercentage <= 1.5)
			this.zoom(2);
		this.DOMPanTo(this.MCToDOM(_point.coords.x), this.MCToDOM(_point.coords.z));
	}

	this.findClickbox = function (_x, _z) {
		for (c in clickboxes) {
			if (
				_x < clickboxes[c].x || 
				_z < clickboxes[c].z || 
				_x > clickboxes[c].rx || 
				_z > clickboxes[c].rz
			) continue;

			return clickboxes[c];
		}

		return null;
	}

	this.zoomPercentage = 1;
	this.zoom = function (_percentage = 1) {
		const screenWidth = document.body.offsetWidth;
		const screenHeight = document.body.offsetHeight;
		const startMapSize = $("#mapCanvas")[0].offsetWidth;

		let viewPosX = mapHolder.scrollLeft + (screenWidth / 2);
		let viewPosY = mapHolder.scrollTop + (screenHeight / 2);
		let percViewPosXMap = viewPosX / startMapSize; // %;
		let percViewPosYMap = viewPosY / startMapSize; // %;

		let endMapSize = startMapSize / this.zoomPercentage * _percentage;

		$("#mapHolder").animate({
			scrollLeft: percViewPosXMap * endMapSize - (screenWidth / 2) + "px",
			scrollTop: percViewPosYMap * endMapSize - (screenHeight / 2) + "px"
		}, this.settings.animationSpeed);

		$("#mapImage").animate({
			width: parseFloat(_percentage) * 100 + "vw"
		}, this.settings.animationSpeed);
		$("#mapCanvas")[0].style.width = parseFloat(_percentage) * 100 + "vw";
		$("#mapCanvas")[0].style.height = parseFloat(_percentage) * 100 + "vw";

		this.zoomPercentage = parseFloat(_percentage);
	}

	this.zoomIn = function () {
		if (this.zoomPercentage + this.settings.zoomStepSize > this.settings.maxZoom)
			return this.zoom(this.settings.maxZoom);
		this.zoom(this.zoomPercentage + this.settings.zoomStepSize);
	}

	this.zoomOut = function () {
		if (this.zoomPercentage - this.settings.zoomStepSize < 1)
			return this.zoom(1);
		this.zoom(this.zoomPercentage - this.settings.zoomStepSize);
	}
}