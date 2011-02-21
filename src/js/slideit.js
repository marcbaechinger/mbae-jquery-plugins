/**
 * slideit - jquery plugin to slide divs child elements of a display right and left
 * 
 * 
 * Features
 *   - key bindings to  arrow keys (left and right)
 *   - back button support (ff3.5+, ie8+, opera10+, safari5+)
 * 
 * TODOs:
 *   - menu for navigation
 * 
 * 
 * @author Marc Bächinger
 */
(function($) {
	var settings = {
		duration: 300
	};

	var methods = {
		/**
		 * initializes the slideit widget
		 */
		init: function(options) {
			var that = this, 
			    initPos = getPositionFromUrlHash(),
			    // create the model which will be 
			    // bound as data object of 'this' with
			    // key slidehow-model
				slideshowModel = {
					// the position at page load
					initPos: initPos,
					currentPosition: initPos,
					// full with with zero
					fullWidth: 0,
					// remember the initial dimension of the container
					displayHeight: that.height(),
					displayWidth: that.width(),
					// grab all children (slides) of the container and add the
					// slideit-slide css class to each slide
					children: that.children()
				};
			// make sure its a block element
			that.css("display", "block");
			slideshowModel.children.each(function() {
					// add class to make the element a slide
					$(this).addClass('slideit-slide')
						.height(that.height())
						.width(that.width());
					// full width is the sum of the width of all children
					slideshowModel.fullWidth += $(this).width();
			});
			
			
			if (options) {
				slideshowModel.settings = $.extend({}, settings, options);
			}
			
			
			// wrap the slide container twice
			// 1)  a div element as a placeholder to span the dimension of a slide
			// 2)  a display element which is taken out of the flow to avoid heavy reflows
			this.wrap("<div class='slideit-display'></div>")
				.parent()
				.width(slideshowModel.displayWidth)
				.height(slideshowModel.displayHeight)
				.wrap("<div class='slideit-placeholder'></div>")
				.parent()
				.height(slideshowModel.displayHeight)
				.width(slideshowModel.displayWidth);
				
		    // make sure all child element can be 
		    // floated left without wrapping
			this.width(slideshowModel.fullWidth);
			
			// bind model to container for later lookup in methods
			this.data('slideshow-model', slideshowModel);
			
			// supported by ff 3.5+, safari?, chrome, ie8+
			$(window).bind('hashchange' , function(e) {
				var pos = getPositionFromUrlHash();
				showSlideAtPosition.apply(that, [pos]);
			});
			
			// register key handlers for navigation
			$(document).keydown(function(ev) {
				if (ev.which === 39) {  // right arrow
					methods.next.apply(that, []);
					ev.preventDefault();
				} else if (ev.which === 37) { //  left arrow			
					methods.previous.apply(that, []);
					ev.preventDefault();
				} else if (ev.which >= 49 && ev.which <= 57) { // keys 1 to 9
					methods.showSlideAt.apply(that, [ev.which % 49]);
					ev.preventDefault();
				} else if (ev.which == 48) { // zero key
					methods.toggleToc.apply(that,[]);
				}
			});

			// create toc if requested 
			createToc(slideshowModel, that);
			
			// init slides to initial position without animation
			if (slideshowModel.initPos > 0 && slideshowModel.initPos < slideshowModel.children.length) {
				this.css("margin-left", (-slideshowModel.initPos * slideshowModel.displayWidth) + "px");
			}
		},
		
		/****
		 * 
		 * moves to the next slide
		 * 
		 */
		next: function() {
			var display = this.data('slideshow-model'),
			    nextPos = display.currentPosition + 1;
			
			if (nextPos <= display.children.length - 1) {
				showSlideAtPosition.apply(this, [nextPos]);
			}
		},
		/**
		 * 
		 * moves to the previous slide
		 * 
		 */
		previous: function() {
			var display = this.data('slideshow-model'),
			    prevPos = display.currentPosition - 1;
			
			if (prevPos >= 0) { 
				showSlideAtPosition.apply(this, [prevPos]);
			}
		},
		/**
		 * 
		 * show the slide at position <code>position</code>
		 * 
		 */
		showSlideAt: function(position) {
			var model = this.data('slideshow-model');
			if (position <= model.children.length && position >= 0) {
				showSlideAtPosition.apply(this, [position]);
			}
		},
		/**
		 * toggles the table of content
		 */
	    toggleToc: function() {
			var model = this.data('slideshow-model');
			
	    	$('.slideit-modal-overlay').toggle();
	    	$('.slideit-toc-overlay').toggle();
	    	updateTocSelection(model.currentPosition);
	    }
	};
	
	/**
	 * switch to slide on position <code>pos</code> with a sliding animation
	 * 
	 * @param pos the position of the slide to be shown 
	 */
	var showSlideAtPosition = function(pos) { 
		var model = this.data('slideshow-model'),
		    posDelta = (model.currentPosition - pos);
		
		// position must be in valid range
		if (pos > -1 && pos < model.children.length && pos != model.currentPosition) {
			this.animate(
				{ marginLeft: '+=' + (posDelta * model.displayWidth) }, 
				model.settings.duration, 
				function() { 
	    			updateTocSelection(pos);
	            }
			);		
			// set current position in display data
			model.currentPosition = pos;
			// set new hash to support back button behaviour
			document.location = "#slide-" + (pos+1);	
		}
	};
	
	/**
	 *  returns the slide position from the hash in the url or
	 * 0 (zero) if no slide is determined by hash  
	 */
	var getPositionFromUrlHash = function() {
		var initPos = 0, // default
			loc = document.location.toString();
		
		if (loc.indexOf("#slide-") > -1) {
			initPos = (loc.substring(loc.lastIndexOf("-") + 1) * 1) - 1;
		}
		return initPos;
	};
	
	var updateTocSelection = function(pos) {
    	$('.slideit-toc-overlay')
    		.find("li")
    		.each(function() {
    			if ($(this).data('pos') == pos) {
    				$(this).addClass("slideit-toc-selection");
    			} else {
    				$(this).removeClass("slideit-toc-selection");
    			}
    		});
	};
	
	var createToc = function(slideshowModel, that) {
		var tocOverlay = $("<div class='slideit-toc-overlay'></div>")
			.appendTo("body");
	    
	    var toc = $("<ul></ul>").appendTo(tocOverlay);
	    toc.click(function(evt) {
	    	if (evt.target.nodeName == "LI" && $(evt.target).data('pos') !== undefined ) {
	    		var pos = $(evt.target).data('pos') * 1;
				showSlideAtPosition.apply(that, [pos]);
	    	}
	    });
	    slideshowModel.children.each(function(idx) {
	    	toc.append("<li data-pos='" + idx + "'>" + ($(this).attr("title") || "Slide " + (idx+1)) + "</li>");

	    });
	    
	    var left = (screen.width - tocOverlay.width()) / 2;
	    var top = ($(window).height() - tocOverlay.height()) / 2;
	    tocOverlay.css({ left: left + "px", top: top + "px"});
	};
	
	/*****
	 * create the plugin function
	 */
	$.fn.slideit = function(method) {
		var that = this;
		var args = arguments;
		return this.each( function() {
			if (methods[method]) {
				return methods[method].apply(that, Array.prototype.slice.call(args, 1));
			} else if (!method || typeof method === 'object') {
				return methods.init.apply(that, args);
			} else {
				$.error('plugin slideit does not have a method ' + method);
			}
		});
	};
	
	/**
	 * add auxiliary elements at document load time
	 */
	$('document').ready(function() {
		// create slideit css classes
		var stylesheet = [
			"<style type='text/css'>" , 
			".slideit-slide {float:left; display:block;} " , 
			".slideit-placeholder {}" ,
			".slideit-display {overflow: hidden; position:absolute;} " , 
			".slideit-modal-overlay {display: none; position:absolute; background-color:#999; opacity:0.85; width:100%; height:100%; z-index:99; top:0; left:0;} " , 
			".slideit-toc-overlay {display: none; position:absolute; width:60%; height:30%; z-index:199;} " , 
			".slideit-toc {overflow: hidden; position:absolute;} " , 
			".slideit-toc-selection { text-shadow: 5px 5px 5px #999; color:#333;  -moz-text-shadow: 5px 5px 5px #999; -webkit-text-shadow: 5px 5px 5px #999; } ",
			"</style>"
		];
		// append stylesheet with plugin style
		$(stylesheet.join("")).appendTo("head");
		// append overlay for modal effects
		$("<div class='slideit-modal-overlay'></div>").appendTo("body");
	});

})(jQuery);
