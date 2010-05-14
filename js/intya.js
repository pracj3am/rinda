(function($){
	
	var 
		fps, hoverOpt, clickOpt,
		pow = Math.pow, sqrt = Math.sqrt, abs = Math.abs, //aliases
		canvas, cw,	ch,	o, containment,
		siId; //setInterval ID
	
	var Mouse = {
		reset: function(e) {
			var d  = new Date();
			this.x = e.pageX;
			this.y = e.pageY;
			this.t = d.getTime();
			this.vx = 0;
			this.vy = 0;
		},
		move: function(e) {
			var d  = new Date();
			if (d.getTime() - this.t > 1000/fps) {
				var ox = this.x,
					oy = this.y,
					ot = this.t;
	
				this.x = e.pageX;
				this.y = e.pageY;
				this.t = d.getTime();
				
				this.vx = 1000/fps*(this.x-ox)/(this.t-ot);
				this.vy = 1000/fps*(this.y-oy)/(this.t-ot);
			}
		}
	}
	
	var Coeff = function(vx, vy) {
		var v2 = pow(vx,2)+pow(vy,2)
		
		return Math.exp(-sqrt(v2)/fps/10); 
	}

	
	$.extend({
		start: function(options) {
			//vmax in pxs/s
			var settings = $.extend({fps: 20, vmax: 100}, options),
				vmax = settings.vmax/settings.fps;
			fps = settings.fps;
			
			o.each(function(){
				$(this).data('v', {
					x: vmax*Math.random()-vmax/2, y: vmax*Math.random()-vmax/2 
				});
			});
	
			siId = window.setInterval(function(){o.frameChange()}, 1000/fps);

		},
		stop: function() {
			window.clearInterval(siId);
		},
		pause: function() {
			window.clearInterval(siId);
		}
	});
	
	$.fn.canvas = function(options) {
		canvas = this;
		cw = canvas.innerWidth();
		ch = canvas.innerHeight();
	}
	
	$.fn.circle = function(hoverOptions, clickOptions) {
		hoverOpt = $.extend({mag: 2, speed: 400, start: function(){}, step: function(){}, complete: function(){} }, hoverOptions);
		clickOpt = $.extend({mag: 2, speed: 400, start: function(){}, step: function(){}, complete: function(){} }, clickOptions);
		
		if (typeof o == 'undefined') {
			o = this;
		} else {
			o.add(this);
		}
		this.wrap('<div/>');
		
		containment = $('<div/>').css({
			position: 'absolute', 
			width: cw, 
			height: ch, 
			top: 0, left: 0,
			zIndex: 1
		}).appendTo(canvas);
		

		this.each(function(){
			var p = $(this).parent()[0];
			$(p).css({
				position: 'absolute',
				width:0, height:0,
				top: Math.round(containment.position().top+Math.random()*containment.height()),
				left: Math.round(containment.position().left+Math.random()*containment.width()),
				zIndex: 99
			});
			
			$(this).position({
				my: 'center center',
				of: p
			});
			$(this).data({
				r: $(this).width()/2, v: {x: 0, y: 0}
			});
		}).hover(function(){
			//$(this).bringOnTop();
			if (!$(this).is('.clicked')) {
				$(this).grow(hoverOpt);
				var r = $(this).data('r')*hoverOpt.mag;
			} else {
				var r = $(this).data('r')*clickOpt.mag;
			}

			containment.css({
				width: cw-2*r, 
				height: ch-2*r, 
				top: r, left: r,
			});
		},function(){
			if (!$(this).is('.clicked')) {
				$(this).ungrow();
			}
		}).parent().unbind().click(function(){
			var r = $(this).children().data('r')*clickOpt.mag;
			containment.css({
				width: cw-2*r, 
				height: ch-2*r, 
				top: r, left: r,
			});


			var po = $(this).children();
			if (!po.is('.clicked')) {
				po.grow(clickOpt).addClass('clicked');
			}
			o.each(function(){
				if ($(this).is('.clicked') && this!=po[0]) {
					$(this).ungrow().removeClass('clicked');
				}
			});

		}).draggable({
			addClasses: false,
			containment: containment,
			scroll: false,
			start: function(e) {
			},
			drag: function(e) {
				$(this).children().preventCollision(o, true);
				Mouse.move(e);
				$(this).children().data('v', {x: 0, y: 0});
			},
			stop: function(e) {
				Mouse.move(e);
				$(this).children().data('v', {x: Mouse.vx, y: Mouse.vy});
				//alert('stop'+Mouse.vx);
			}
		}).mousedown(function(e){
			Mouse.reset(e);
			$(this).children().data('v', {x: 0, y: 0});
		}).mouseup(function(e){
			//Mouse.move(e);
			//alert('up'+Mouse.vx);
			//$(this).children().data('v', {x: Mouse.vx, y: Mouse.vy});
		});
		
	}
	
	$.fn.grow = function(opts) {
		opts.start();
		
		this.stop().animate({
			width: opts.mag*$(this).data('r')*2,
			height: opts.mag*$(this).data('r')*2,
			top: -opts.mag/2*$(this).data('r')*2,
			left: -opts.mag/2*$(this).data('r')*2
		},{
			duration: opts.speed,
			step: function(){
				var xy = $(this).coords();
				$(this).coords({ // to be inside canvas
					x: Math.max(Math.min(cw-xy.r, xy.x),xy.r),
					y: Math.max(Math.min(ch-xy.r, xy.y),xy.r)
				});
				$(this).preventCollision(o, true);
				opts.step();
			},
			complete: function() {
				opts.complete();
			}
		});
		
		return this;
	}

	$.fn.ungrow = function() {
		this.stop().animate({
			width: $(this).data('r')*2,
			height: $(this).data('r')*2,
			top: -$(this).data('r'),
			left: -$(this).data('r')
		}, 400);
		return this;
	}
	
	$.fn.bringOnTop = function() {
		o.parent().css({zIndex: 99});
		this.parent().css({zIndex: 100});
		return this;
	}
	
	$.fn.coords = function(coords, pushed) {
		var pos = this.parent().position(),
			ocoords = {x: pos.left, y: pos.top, r: this.width()/2};
		
		//objekt je chtěn na nové pozici
		if (typeof coords == 'object') {
			if (typeof coords.r == 'undefined')
				coords.r = ocoords.r;
				
			var ncoords = {}, //nová poloha
				moved = true,
				r  = coords.r;

			if (coords.x-coords.r>=0 && coords.x+coords.r<=cw && coords.y-coords.r>=0 && coords.y+coords.r<=ch) {
				//je unvitř canvasu
				ncoords = coords;
			} else {
				// změna rychlosti
				var c = Coeff(this.data('v').x, this.data('v').y);
				if (coords.y-r<0) {
					//horní strana
					this.data('v', {x: this.data('v').x, y: -this.data('v').y*c});
				} else if (coords.y+r>ch) {
					//dolní strana
					this.data('v', {x: this.data('v').x, y: -this.data('v').y*c});
				} else if (coords.x-r<0) {
					//levá strana
					this.data('v', {x: -this.data('v').x*c, y: this.data('v').y});
				} else if (coords.x+r>cw){
					//pravá strana
					this.data('v', {x: -this.data('v').x*c, y: this.data('v').y});
				}

				if (pushed == true) {//nové místo hledáme, jen když je něčím tlačena
					//přímka, na které leží starý a nový střed
					var a  = (coords.y-ocoords.y)/(coords.x-ocoords.x);
					if (abs(a)>1000) {
						var x0 = coords.x, y0 = coords.y;
					} else {
						var 
							b  = (coords.x*ocoords.y-coords.y*ocoords.x)/(coords.x-ocoords.x),
							cos  = 1/sqrt(pow(a,2)+1),
							a1 = -1/a,
							cos1 = abs(a)*cos,
							// průsečík přímky a nové polohy kružnice
							x1 = coords.x > ocoords.x ? coords.x-r*cos : coords.x+r*cos,
							y1 = a*x1+b,
							b1 = y1-a1*x1;
							// průsečíky přímky a*x+b s okrajem canvasu
							// xt = -b/a, xb = (ch-b)/a, yl = b, yr = a*cw+b;
						if (/*0 < xt && xt < cw && */coords.y-r<0) {
							//horní strana
							var y0 = r, x0 = 1/a1*(r/cos1-b1+r);
						} else if (/*0 < xb && xb < cw && */coords.y+r>ch) {
							//dolní strana
							var y0 = ch-r, x0 = 1/a1*(-r/cos1-b1+ch-r);
						} else if (/*0 < yl && yl < ch && */coords.x-r<0) {
							//levá strana
							if (abs(a) < 0.001) {
								var x0 = coords.x, y0 = coords.y;	
							} else {
								var x0 = r, y0 = abs(a1)/a1*r/cos1+a1*r+b1;
							}
						} else if (coords.x+r>cw){
							//pravá strana
							if (abs(a) < 0.001) {
								var x0 = coords.x, y0 = coords.y;	
							} else {
								var x0 = cw-r, y0 = -abs(a1)/a1*r/cos1+a1*(cw-r)+b1;
							}
						}
					}
				} else {
					var x0 = coords.x, y0 = coords.y;
				} 
				
				if (x0<r || x0>cw-r || y0<r || y0>ch-r) {
					moved = false;
					x0 = Math.max(Math.min(cw-r, x0),r);
					y0 = Math.max(Math.min(ch-r, y0),r);
					//x0 = ocoords.x;
					//y0 = ocoords.y;
				}

				ncoords = {x: x0, y: y0, r: coords.r};
			}			
			
			this.parent().css({left: ncoords.x, top: ncoords.y});
			
			return moved;
		}
		
		return ocoords;
	}
	
	$.fn.preventCollision = function(oo, pushed) {
		var sc = this.coords(),
			sx = sc.x, sy = sc.y,
			sv = $(this).data('v'),
			s = this,
			prevented = true;
		oo = oo.not(this);
		oo.each(function(){
			var oc = $(this).coords(), gu = $(),
				ox = oc.x, oy = oc.y,
				ov = $(this).data('v'),
				f = sc.r + oc.r,
				over = sqrt(pow(sx-ox,2)+pow(sy-oy,2)) < f;
			if (over) {
				var moved;
				if (abs(sy-oy) < 0.001 && abs(sx-ox) < 0.001) {
					//objekty se identicky překrývají
					var alpha = Math.random()*2*Math.PI;
					moved = $(this).coords({x: sx + f*Math.sin(alpha), y: sy + f*Math.cos(alpha)}, pushed);
				} else {
					var tg = (sy-oy)/(sx-ox),
						sco = Coeff(sv.x, sv.y),
						oco = Coeff(ov.x, ov.y),
						m;
					
					// "relativní hmotnost"
					if ($(s).is('.clicked')) {
						m = 0;
					} else if ($(this).is('.clicked')) {
						m = 1;
					} else {
						m = .5;
					}
					if (abs(tg)>1000) {
						moved = $(this).coords({x: ox, y: oy>sy ? sy+f : sy-f}, pushed);
				 		//změna rychlosti
				 		var
							dv = ov.y-sv.y;
						$(s).data('v', {
							x: sv.x,
							y: (sv.y+2*m*dv)*sco
						});
						$(this).data('v', {
							x: ov.x,
							y: (ov.y-2*(1-m)*dv)*oco
						});

					} else {
						var //přímka, na které leží středy kruhů
							b = (sx*oy-sy*ox)/(sx-ox),
							cos = 1/sqrt(pow(tg,2)+1),
							sin = tg*cos,
							x1 = sx<ox ? sx+f*cos : sx-f*cos; //polohy na přímce tak, aby se kružnice dotýkaly
		
				 		moved = $(this).coords({x: x1, y: tg*x1+b}, pushed);
				 		
				 		//změna rychlosti
				 		var
							dv = ov.x*cos+ov.y*sin-sv.x*cos-sv.y*sin;
						$(s).data('v', {
							x: (sv.x+2*m*dv*cos)*sco,
							y: (sv.y+2*m*dv*sin)*sco
						});
						$(this).data('v', {
							x: (ov.x-2*(1-m)*dv*cos)*oco,
							y: (ov.y-2*(1-m)*dv*sin)*oco
						});
				 		
				 	}
 				}
			 	prevented = prevented && moved;
			 	
			 	if (!$(this).preventCollision(oo, pushed)) {
			 		// nepodařilo se zabránit kolizi, zůstaneme tam, kde jsme
			 		$(this).coords({x: ox, y: oy});
			 		prevented = false;
			 	}
			}
		});
		
		return prevented;
	}

	$.fn.frameChange = function() {
		var o = this;
		this.each(function(index){
			var c = $(this).coords();
			$(this).coords({
				x: c.x + $(this).data('v').x,
				y: c.y + $(this).data('v').y
			});
			$(this).preventCollision(o);
		});
	}

})(jQuery);