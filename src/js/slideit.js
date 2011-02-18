/**
 * slideit - jquery plugin to slide divs child elements of a display right and left
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
			if (options) {
				$.extend(settings, options);
			}
			// init full with with zero
			var fullWidth = 0;
			// remember the initial width of the container
			var displayWidth = this.width();
			var displayHeight = this.height();
			// grab all children (slides) of the container and add the
			// slideit-slide css class to each slide
			var children = this.children().each(function() {
				// add class to make the element a slide
				$(this).addClass('slideit-slide');
				// increase full width with the current slides width
				fullWidth += $(this).width();
			});
			
			// wrap the slide container with a display element
			this.wrap("<div class='slideit-display'></div>")
				.parent()
				.width(displayWidth)
				.height(displayHeight)
				.wrap("<div></div>")
				.parent()
				.height(displayHeight)
				.width(displayWidth);
		    // make sure all child element can be 
		    // floatet left without wrapping
			this.width(fullWidth);
			
			// bind computed variables to container
			this.data('slide-display', {
				displayWidth: displayWidth, 
				currentPosition: 0,
				children: children,
				settings: settings
			});
		},
		/**
		 * moves to the next slide
		 */
		next: function() {
			var display = this.data('slide-display'),
			    nextPos = display.currentPosition + 1;
			
			if (nextPos <= display.children.length - 1) {
				showSlideAtPosition.apply(this, [nextPos]);
			}
		},
		/**
		 * moves to the previous slide
		 */
		previous: function() {
			var display = this.data('slide-display'),
			    prevPos = display.currentPosition - 1;
			
			if (prevPos >= 0) { 
				showSlideAtPosition.apply(this, [prevPos]);
			}
		},
		/**
		 * show the slide at position <code>position</code>
		 */
		showSlideAt: function(position) {
			var display = this.data('slide-display');
			if (position <= display.children.length && position >= 0) {
				showSlideAtPosition.apply(this, [position]);
			}
		}
	};
	
	/**
	 * switch to slide on position <code>pos</code>
	 * 
	 * ßparam 
	 */
	var showSlideAtPosition = function(pos) { 
		var displayData = this.data('slide-display');
		
		var posDelta = (displayData.currentPosition - pos);
		this.animate({
		    marginLeft: '+=' + (posDelta * displayData.displayWidth)
		  }, displayData.settings.duration, function() {
		  	
		  });

		
		displayData.currentPosition = pos;
	};
	
	// create sliteit-slide css class
	$("<style type='text/css'>" + 
		".slideit-slide { float: left;	} " + 
		".slideit-display { overflow: hidden; position: absolute;} " + 
	"</style>").appendTo("head");


	$.fn.slideit = function(method) {
		var that = this;
		var args = arguments;
		return this.each( function() {
			if (methods[method]) {
				return methods[method].apply(that, Array.prototype.slice.call(arguments, 1));
			} else if (!method || typeof method === 'object') {
				return methods.init.apply(that, args);
			} else {
				$.error('plugin slideit does not have a method ' + method);
			}
		});
	};
})(jQuery);
