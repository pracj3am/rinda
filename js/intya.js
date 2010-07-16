/*!
 * Illustrative example of usage of rinda library
 */
$(function(){
	var opt;

	$('#x').canvas();
	$('#x .o').circle(opt = {
		mag: 1.3056,
		speed: 400,
		step: function(circle) {
			var r = $(circle).data('r');
			$(circle).children('img').width(2*r).height(2*r);
		},
		complete: this.step
	}, {
		speed: opt.speed,
		step: opt.step,
		complete: this.step
	}, {
		mag: 2.2,
		speed: opt.speed,
		start: function(circle) {
			$(circle).children('img').attr('src', function(i, src){
				return src.replace(/(\d)\./,'$1x.');
			});
		},
		step: opt.step,
		complete: function(circle){
			this.step(circle);
			$(circle).addClass('big');
		}
	}, {
		speed: opt.speed,
		start: function(circle){
			$(circle).removeClass('big');
		},
		step: opt.step,
		complete: function(circle) {
			this.step(circle);
			$(circle).children('img').attr('src', function(i, src){
				return src.replace(/(\d)x\./,'$1.');
			});
		}
	});

	$.start({
		fps: 10,
		vmax: 100
	})
});