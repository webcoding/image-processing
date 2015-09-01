"use strict"

function Canvas(options){

    // initialize canvas
    this.canvas = document.getElementById(options.id);
    this.context = this.canvas.getContext('2d');

    this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.canvas.width = options.width;
    this.canvas.height = options.height;

    this.dimensions = this.canvas.getBoundingClientRect();
}

Canvas.prototype = {

    drawImage: function(url, onready){
        //fills scaled image to canvas and centers it

        var _dimensions = this.dimensions;
        var _context = this.context;

        // create image 
        var img = new Image();
        img.src = url;
        img.onload = function(){
            // set image to fill and center in canvas
            var imgWidth = _dimensions.width;
            var imgHeight = this.height * _dimensions.width/this.width;

            // offsets to center image
            var imgOffsetHeight = -(imgHeight - _dimensions.height)/2
            var imgOffsetWidth = -(imgWidth - _dimensions.width)/2
            
            _context.drawImage(img, imgOffsetWidth, imgOffsetHeight, imgWidth, imgHeight);

            // do callback on image load
            onready();
        }

    },

    applyFilter: function(f){
        f.doFilter(this);
    },

    doEdgeDetect: function(ed){
        var edges = []; // keep track of pixels that are edges
        var edgeColor = [255, 255, 0, 255]; // color to mark edge
        var data = this.getDataArr();

        // callbacks to draw yellow lines on edges
        var onConvoluted = function(index, isEdge){
            //on convoluted callback, for each window that starts 
            // with pixel at index (top left corner)
            
            // if window is an edge, mark as such with color, 
            // else just print original pixel color
            if(isEdge){
                Array.prototype.push.apply(edges, edgeColor);
            }
            else{
                var transparentPix = data[index].slice();

                // make pix slightly transparent
                transparentPix[3] = 200;
                Array.prototype.push.apply(edges, transparentPix);
            }
        }

        var onConvolutionDone = function(){
            // pad missing edges. edge detected image will be smaller than 
            // original because cannot determine edges at image edges
            var missing = data.length*data[0].length - edges.length
            for(var i = 0; i < missing/4; i++){
                Array.prototype.unshift.apply(edges, edgeColor);
            }

            // overwrite image with the edges
            this.context.putImageData(
                new ImageData(
                new Uint8ClampedArray(edges), this.canvas.width, this.canvas.height),
                0, 0);
        }.bind(this);

        ed.doDetect(this, onConvoluted, onConvolutionDone);
    },

    getDataArr: function(){
        // return image data as 2D array, one 4 element array per pixel
        // [[r,g,b,a],...[r,g,b,a]] for easier looping
        var imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        var data = imageData.data;

        var arr = [];
        for(var i = 0; i < data.length; i += 4){
            var pixel = [data[i], data[i+1], data[i+2], data[i+3]];
            arr.push(pixel);
        }
        return arr;
    },
}