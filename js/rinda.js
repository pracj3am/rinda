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
		hoverOpt, unHoverOpt, clickOpt, unClickOpt,
		sqrt = Math.sqrt, abs = Math.abs, //aliases
		canvas, cw,	ch,	o,
		rinda = {},
        C = [30, 20, 15],
        H = new Hashtable;

	var Mouse = {
		reset: function(e) {
			this.x = e.pageX;
			this.y = e.pageY;
			this.t = (new Date).getTime();
			this.vx = 0;
			this.vy = 0;
		},
		move: function(e) {
			var t = (new Date).getTime()
            if (t - this.t > rinda.tickInterval) {
				var ox = this.x,
					oy = this.y,
					ot = this.t;

				this.x = e.pageX;
				this.y = e.pageY;
				this.t = t;

				this.vx = 1012*(this.x-ox)/(this.t-ot);
				this.vy = 1012*(this.y-oy)/(this.t-ot);
			}
		}
	}

	var Coeff = function(v) {
		var v2 = v.x*v.x+v.y*v.y

		return Math.exp(-sqrt(v2)/1000);
	}

	rinda.canDecreaseFps = true;
    rinda.fpsChoice = 0;

	$.extend({
		start: function(options) {
			//vmax in pxs/s
			var settings = $.extend({vmax: 100}, options),
				vmax = settings.vmax;

			o.each(function(){
				$(this).rindata('v', {
					x: vmax*Math.random()-vmax/2, y: vmax*Math.random()-vmax/2
				});
			});

            rinda.globalTime = 0;
            rinda.initializeTickTimer();
		},
		stop: function() {
			window.clearInterval(rinda.tickTimer);
		},
		pause: function() {
			window.clearInterval(rinda.tickTimer);
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

		this.wrap('<div/>');


		this.parent().each(function(){
			var oo = $(this),
                c = $(this).children(),
				r = c.width()/2;


            if (typeof o == 'undefined') {
                o = $(this);
            } else {
                o = o.add(this);
            }

            oo.css({
				position: 'absolute',
				width:0, height:0,
				top: Math.round(r+Math.random()*(ch-r)),
				left: Math.round(r+Math.random()*(cw-r)),
				zIndex: 99
			});

			c.css({
				position: 'relative',
				top: -r,
                left: -r
			});

			oo.rindata({
				x: oo.position().left,
				y: oo.position().top,
				r: r, size: r,
				v: {x: 0, y: 0},
                c: c,
				dragged: false,
				clicked: false,
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

		}).unbind().hover(function(){
			if (!$(this).rindata('clicked')) {
				$(this).grow(hoverOpt);
				$(this).draggable('option', 'containment', $(this).rindata('containmentH'));
			} else {
				$(this).draggable('option', 'containment', $(this).rindata('containmentC'));
			}
		},function(){
			if (!$(this).rindata('clicked')) {
				$(this).ungrow(unHoverOpt);
			}
		}).click(function(){

			if (!$(this).rindata('clicked')) {
				$(this).rindata('clicked', true).grow(clickOpt);
			}
            oo = this;
			o.each(function(){
				if ($(this).rindata('clicked') && this!=oo) {
					$(this).rindata('clicked', false).ungrow(unClickOpt);
				}
			});

		}).draggable({
			addClasses: false,
			scroll: false,
			start: function(e) {
				$(this).bringOnTop();
				$(this).rindata('dragged', true);
			},
			drag: function(e) {
				var pos = $(this).position();
				Mouse.move(e);
				$(this).rindata('x', pos.left);
				$(this).rindata('y', pos.top);
				$(this).rindata('v', {x: 0, y: 0});
				$(this).preventCollision(o);
			},
			stop: function(e) {
				var pos = $(this).position();
				Mouse.move(e);
				$(this).rindata('x', pos.left);
				$(this).rindata('y', pos.top);
				$(this).rindata('v', {x: Mouse.vx, y: Mouse.vy});
				$(this).rindata('dragged', false);
			}
		}).mousedown(function(e){
			Mouse.reset(e);
			$(this).rindata('v', {x: 0, y: 0});
		}).mouseup(function(e){
			//Mouse.move(e);
			//alert('up'+Mouse.vx);
			//$(this).children().rindata('v', {x: Mouse.vx, y: Mouse.vy});
		});

	}

	$.fn.grow = function(opts) {
		var c = this.rindata('c'),
            oo = this;
        opts.start(c);
        this.bringOnTop();

		c.stop().animate({
			width: opts.mag*oo.rindata('size')*2,
			height: opts.mag*oo.rindata('size')*2,
			top: -opts.mag/2*oo.rindata('size')*2,
			left: -opts.mag/2*oo.rindata('size')*2
		},{
			duration: opts.speed,
			step: function(){
				oo.rindata('r', c.width()/2);
				var xy = oo.coords();
				oo.coords({ // to be inside canvas
					x: Math.max(Math.min(cw-xy.r, xy.x),xy.r),
					y: Math.max(Math.min(ch-xy.r, xy.y),xy.r)
				});
				oo.preventCollision(o);
				opts.step(c);
			},
			complete: function() {
				oo.rindata('r', c.width()/2);
				opts.complete(c);
			}
		});

		return this;
	}

	$.fn.ungrow = function(opts) {
		var c = this.rindata('c'),
            oo = this;
		opts.start(c);

		c.stop().animate({
			width: oo.rindata('size')*2,
			height: oo.rindata('size')*2,
			top: -oo.rindata('size'),
			left: -oo.rindata('size')
		}, {
			duration: opts.speed,
			step: function() {
				oo.rindata('r', c.width()/2);
				opts.step(c);
			},
			complete: function() {
				oo.rindata('r', c.width()/2);
				opts.complete(c);
			}
		});
		return this;
	}

	$.fn.bringOnTop = function() {
		o.each(function(){
            $(this).css({zIndex: 99});
        });
		this.css({zIndex: 100});
		return this;
	}

	$.fn.coords = function(coords, pushed) {
		var ocoords = {x: this.rindata('x'), y: this.rindata('y'), r: this.rindata('r')};

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
				var c = Coeff(this.rindata('v'));
				if (coords.y-r<0) {
					//horní strana
					this.rindata('v', {x: this.rindata('v').x, y: -this.rindata('v').y*c});
				} else if (coords.y+r>ch) {
					//dolní strana
					this.rindata('v', {x: this.rindata('v').x, y: -this.rindata('v').y*c});
				} else if (coords.x-r<0) {
					//levá strana
					this.rindata('v', {x: -this.rindata('v').x*c, y: this.rindata('v').y});
				} else if (coords.x+r>cw){
					//pravá strana
					this.rindata('v', {x: -this.rindata('v').x*c, y: this.rindata('v').y});
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
						if (coords.y-r<0) {
							//horní strana
							var y0 = r, x0 = 1/a1*(r/cos1-b1+r);
						} else if (coords.y+r>ch) {
							//dolní strana
							var y0 = ch-r, x0 = 1/a1*(-r/cos1-b1+ch-r);
						} else if (coords.x-r<0) {
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

			this.css({left: ncoords.x, top: ncoords.y});
			this.rindata('x', ncoords.x);
			this.rindata('y', ncoords.y);

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

	$.fn.tryMove = function(coords, oo) {
		if (this.rindata('dragged')) {
			return;
		}

		var s = this,
			sCoords = $(this).coords(),
			move = true;

		$(this).coords(coords);

        if (false /*rinda.globalTime % 2 == 0*/) {

            oo.each(function(){
                var collided =
                $(this).handleCollision(s, function(o, G){
                    if (G.overlap && !G.ident) {
                        var sv = $(s).rindata('v'), ov = $(o).rindata('v'),
                            sco = Coeff(sv),
                            oco = Coeff(ov),
                            dv = ov.x*G.cos+ov.y*G.sin-sv.x*G.cos-sv.y*G.sin,
                            m;

                        // "relativní hmotnost"
                        if ($(s).rindata('clicked')) {
                            m = 0;
                        } else if ($(o).rindata('clicked')) {
                            m = 1;
                        } else {
                            m = .5;
                        }

                        //změna rychlosti
                        $(s).rindata('v', {
                            x: (sv.x+2*m*dv*G.cos)*sco,
                            y: (sv.y+2*m*dv*G.sin)*sco
                        });
                        $(o).rindata('v', {
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
        }
	}

    $.fn.rindata = function (key, value) {
        if (typeof key == 'object') {
            H.put(this[0], key);
        } else {
            var d = H.get(this[0]);
            if (typeof value == 'undefined') {
                if (d != null && typeof d == 'object') return d[key];
                return null;
            } else {
                if (d != null && typeof d == 'object') {
                    d[key] = value;
                } else {
                    d = new Object;
                    d[key] = value;
                }
                H.put(this[0], d)
            }
        }
    }

    rinda.initializeTickTimer = function() {
        window.clearInterval(rinda.tickTimer);
        rinda.fps = C[rinda.fpsChoice];
        rinda.tickInterval = 1000/rinda.fps;
        rinda.lastTime = (new Date).getTime();
        rinda.lastTimeDelta = 0;
        rinda.lastTimeSlownessCount = 0;

		rinda.tickTimer = window.setInterval(rinda.tick, rinda.tickInterval);
    };

	rinda.tick = function() {

        var b = (new Date).getTime();
        rinda.lastTimeDelta += b - rinda.lastTime - rinda.tickInterval;
        if (rinda.lastTimeDelta > 100) rinda.lastTimeDelta = 100;
        if (rinda.lastTimeDelta > 50) {
            rinda.lastTimeSlownessCount++;
            rinda.lastTimeSlownessCount == 20 && rinda.canDecreaseFps && rinda.decreaseFps();
            window.location.hash = rinda.fps+':'+rinda.lastTimeSlownessCount;
        }
        var c = 0;
        if (rinda.lastTimeDelta > rinda.tickInterval) {
            c = Math.floor(rinda.lastTimeDelta / rinda.tickInterval);
            rinda.lastTimeDelta -= rinda.tickInterval * c
        }
        rinda.lastTime = b;
        rinda.globalTime++;

        var oo = o;
        o.each(function(){
			var co = $(this).coords(),
                v = $(this).rindata('v');
            //oo = oo.not(this);
			$(this).tryMove({
				x: co.x + v.x/rinda.fps*(1+c),
				y: co.y + v.y/rinda.fps*(1+c)
			},oo);
		});
	};

    rinda.decreaseFps = function () {
        if (rinda.fpsChoice < C.length - 1) {
            rinda.fpsChoice++;
            rinda.initializeTickTimer();
            if (rinda.fpsChoice == C.length - 1) rinda.canDecreaseFps = false
        }
    };


})(jQuery);