$(function(){
	
	$('#x').canvas();
	$('#x .o').circle({
		mag: 1.5,
		speed: 400
	}, {
		mag: 2.2,
		speed: 400
	});
	$.start({
		fps: 10,
		vmax: 100
	})
});