/*!
 * Illustrative example of usage of rinda library
 */
$(function(){

	$('#x').canvas();
	$('#x .o').circle({
		mag: 1.3056,
		speed: 400,
		step: function(circle){
			var r = $(circle).data('r');
			$(circle).children('img').width(2*r).height(2*r);
		},
		complete: this.step
	}, {
		mag: 2.2,
		speed: 400
	});
	$.start({
		fps: 10,
		vmax: 100
	})
});