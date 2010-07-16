/*!
 * rinda!
 * http://rinda.intya.cz/
 *
 * Copyright 2010, Jan Prachař
 * Copyright 2010, Intya, s.r.o.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 */
(function($){
	
	var 
		fps, hoverOpt, unHoverOpt, clickOpt, unClickOpt,
		sqrt = Math.sqrt, abs = Math.abs, //aliases
		canvas, cw,	ch,	o,
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
	
	var Coeff = function(v) {
		var v2 = v.x*v.x+v.y*v.y
		
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
	
	$.fn.circle = function(hoverOptions, unHoverOptions, clickOptions, unClickOptions) {
		hoverOpt = $.extend({mag: 2, speed: 400, start: function(){}, step: function(){}, complete: function(){} }, hoverOptions);
		unHoverOpt = $.extend({speed: 400, start: function(){}, step: function(){}, complete: function(){} }, unHoverOptions);
		clickOpt = $.extend({mag: 2, speed: 400, start: function(){}, step: function(){}, complete: function(){} }, clickOptions);
		unClickOpt = $.extend({speed: 400, start: function(){}, step: function(){}, complete: function(){} }, unClickOptions);
		
		if (typeof o == 'undefined') {
			o = this;
		} else {
			o.add(this);
		}
		this.wrap('<div/>');
		

		this.each(function(){
			var p = $(this).parent()[0],
				r = $(this).width()/2;
			$(p).css({
				position: 'absolute',
				width:0, height:0,
				top: Math.round(r+Math.random()*(ch-r)),
				left: Math.round(r+Math.random()*(cw-r)),
				zIndex: 99
			});
			
			$(this).position({
				my: 'center center',
				of: p
			});
			
			$(this).data({
				x: $(p).position().left,
				y: $(p).position().top,
				r: r, size: r,
				v: {x: 0, y: 0},
				dragged: false,
				clicked: false,
                parent: $(p),
				containmentH: $('<div/>').css({
					position: 'absolute', 
					width: cw-2*r*hoverOpt.mag, 
					height: ch-2*r*hoverOpt.mag, 
					top: r*hoverOpt.mag, left: r*hoverOpt.mag,
					zIndex: 1
				}).appendTo(canvas),
				containmentC: $('<div/>').css({
					position: 'absolute', 
					width: cw-2*r*clickOpt.mag, 
					height: ch-2*r*clickOpt.mag, 
					top: r*clickOpt.mag, left: r*clickOpt.mag,
					zIndex: 1
				}).appendTo(canvas)
			});
			
		}).hover(function(){
			if (!$(this).data('clicked')) {
				$(this).grow(hoverOpt);
				$(this).data('parent').draggable('option', 'containment', $(this).data('containmentH'));
			} else {
				$(this).data('parent').draggable('option', 'containment', $(this).data('containmentC'));
			}
		},function(){
			if (!$(this).data('clicked')) {
				$(this).ungrow(unHoverOpt);
			}
		}).parent().unbind().click(function(){

			var po = $(this).children();
			if (!po.data('clicked')) {
				po.grow(clickOpt).data('clicked', true);
			}
			o.each(function(){
				if ($(this).data('clicked') && this!=po[0]) {
					$(this).ungrow(unClickOpt).data('clicked', false);
				}
			});

		}).draggable({
			addClasses: false,
			scroll: false,
			start: function(e) {
				$(this).children().bringOnTop();
				$(this).children().data('dragged', true);
			},
			drag: function(e) {
				var pos = $(this).position();
				Mouse.move(e);
				$(this).children().data('x', pos.left);
				$(this).children().data('y', pos.top);
				$(this).children().data('v', {x: 0, y: 0});
				$(this).children().preventCollision(o);
			},
			stop: function(e) {
				var pos = $(this).position();
				Mouse.move(e);
				$(this).children().data('x', pos.left);
				$(this).children().data('y', pos.top);
				$(this).children().data('v', {x: Mouse.vx, y: Mouse.vy});
				$(this).children().data('dragged', false);
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
		opts.start(this[0]);
		
		this.stop().animate({
			width: opts.mag*$(this).data('size')*2,
			height: opts.mag*$(this).data('size')*2,
			top: -opts.mag/2*$(this).data('size')*2,
			left: -opts.mag/2*$(this).data('size')*2
		},{
			duration: opts.speed,
			step: function(){
				$(this).data('r', $(this).width()/2);
				var xy = $(this).coords();
				$(this).coords({ // to be inside canvas
					x: Math.max(Math.min(cw-xy.r, xy.x),xy.r),
					y: Math.max(Math.min(ch-xy.r, xy.y),xy.r)
				});
				$(this).preventCollision(o);
				opts.step(this);
			},
			complete: function() {
				$(this).data('r', $(this).width()/2);
				opts.complete(this);
			}
		});
		
		return this;
	}

	$.fn.ungrow = function(opts) {
		opts.start(this[0]);

		this.stop().animate({
			width: $(this).data('size')*2,
			height: $(this).data('size')*2,
			top: -$(this).data('size'),
			left: -$(this).data('size')
		}, {
			duration: opts.speed,
			step: function() {
				$(this).data('r', $(this).width()/2);
				opts.step(this);
			},
			complete: function() {
				$(this).data('r', $(this).width()/2);
				opts.complete(this);
			}
		});
		return this;
	}
	
	$.fn.bringOnTop = function() {
		o.each(function(){
            $(this).data('parent').css({zIndex: 99});
        });
		this.data('parent').css({zIndex: 100});
		return this;
	}
	
	$.fn.coords = function(coords, pushed) {
		var ocoords = {x: this.data('x'), y: this.data('y'), r: this.data('r')};
		
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
				var c = Coeff(this.data('v'));
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
							cos  = 1/sqrt(a*a+1),
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
			
			this.data('parent').css({left: ncoords.x, top: ncoords.y});
			this.data('x', ncoords.x);
			this.data('y', ncoords.y);
			
			return moved;
		}
		
		return ocoords;
	}
	
	$.fn.handleCollision = function(s, cb) {
		var sc = $(s).coords(), sx = sc.x, sy = sc.y,
			oc = this.coords(), ox = oc.x, oy = oc.y,
			o = this;
			G = new Object; //geometrie srážky

		G.sc = sc;
		G.oc = oc;
		G.f = sc.r + oc.r; //vzdálenost středů
		// if overlap
		if (sqrt((sx-ox)*(sx-ox)+(sy-oy)*(sy-oy)) < G.f) {
			G.overlap = true;
			if (abs(sy-oy) < 0.001 && abs(sx-ox) < 0.001) {
				G.ident = true;			
			} else {
				G.ident = false;
				G.tg = (sy-oy)/(sx-ox);
				if (abs(G.tg)>1000) {
					G.cos = 0;
					G.sin = 1;
					G.z = {x: ox, y: oy>sy ? sy+G.f : sy-G.f}; // bod pro this tak, aby se kružnice dotýkaly
				} else {
					G.cos = 1/sqrt(G.tg*G.tg+1);
					G.sin = G.tg*G.cos;
					var x1 = sx<ox ? sx+G.f*G.cos : sx-G.f*G.cos;
					G.z = {x: x1, y: G.tg*x1 + (sx*oy-sy*ox)/(sx-ox)}; // bod pro this tak, aby se kružnice dotýkaly
					
				}
			}
		} else {
			G.overlap = false;
		}
		return cb(o, G);
	}

	$.fn.preventCollision = function(oo) {
		var s = this,
			prevented = true;
		oo = oo.not(this);
		oo.each(function(){
			$(this).handleCollision(s, function(o, G){
				if (G.overlap) {
					var moved;
					if (G.ident) {
						var alpha = Math.random()*2*Math.PI;
						moved = $(o).coords({x: G.sc.x + G.f*Math.sin(alpha), y: G.sc.y + G.f*Math.cos(alpha)}, true);
					} else {
						moved = $(o).coords(G.z, true); 
					}
				 	prevented = prevented && moved;
				 	if (!$(o).preventCollision(oo)) {
				 		// nepodařilo se zabránit kolizi, zůstaneme tam, kde jsme
				 		$(o).coords({x: G.oc.x, y: G.oc.y});
				 		prevented = false;
				 	}
				}
			});

		});
		
		return prevented;
	}
	
	$.fn.tryMove = function(coords) {
		if (this.data('dragged')) {
			return;
		}
		
		var s = this,
			sCoords = $(this).coords(),
			oo = o.not(this),
			move = true;
			
		$(this).coords(coords);
		oo.each(function(){
			var collided =
			$(this).handleCollision(s, function(o, G){
				if (G.overlap && !G.ident) {
					var sv = $(s).data('v'), ov = $(o).data('v'),
						sco = Coeff(sv),
						oco = Coeff(ov),
						dv = ov.x*G.cos+ov.y*G.sin-sv.x*G.cos-sv.y*G.sin,
						m;
					
					// "relativní hmotnost"
					if ($(s).data('clicked')) {
						m = 0;
					} else if ($(o).data('clicked')) {
						m = 1;
					} else {
						m = .5;
					}
					
			 		//změna rychlosti
					$(s).data('v', {
						x: (sv.x+2*m*dv*G.cos)*sco,
						y: (sv.y+2*m*dv*G.sin)*sco
					});
					$(o).data('v', {
						x: (ov.x-2*(1-m)*dv*G.cos)*oco,
						y: (ov.y-2*(1-m)*dv*G.sin)*oco
					});
					return true;
				}
				return false;
			});
			move = move && !collided;
			
		});
		
		if (!move) {
			$(this).coords(sCoords);
		}
		return this;
	}

	$.fn.frameChange = function() {
		this.each(function(){
			var c = $(this).coords();
			$(this).tryMove({
				x: c.x + $(this).data('v').x,
				y: c.y + $(this).data('v').y
			});
		});
	}

})(jQuery);