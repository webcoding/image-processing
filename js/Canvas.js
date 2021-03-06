"use strict"

function Canvas(options){

    // initialize canvas
    this.canvas = document.getElementById(options.id);
    this.context = this.canvas.getContext('2d');

    this.context.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.canvas.width = options.width;
    this.canvas.height = options.height;

    this.dimensions = this.canvas.getBoundingClientRect();
    this.edges = null; //save detected edge magnitudes

}

Canvas.prototype = {
    tmp:{
        // store buffered stuff
    },
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

    convolve: function(kernel){
        // does convolution given a kernel. missing edge pixels because
        // of how kernel works centered on a something

        var context = this.context;
        var canvas = this.canvas;
        var data = this.getDataArr();

        var maxPixelOffset = canvas.width * kernel.length * 2 - 2;

        var newPixels = [];

        for(var i = 0; i < data.length - maxPixelOffset; i++){
            var sum = 0;
            for(var a = 0; a < kernel.length; a++){
                for(var b = 0; b < kernel[a].length; b++){
                    // math to get px position in window
                    var offset = canvas.width*a;
                    var px = data[i + offset + b];

                    // new value for pixel
                    var newVal = kernel[a][b] * px[0];
                    sum += newVal;
                }
            }

            Array.prototype.push.apply(newPixels, [sum, sum, sum, 255]);
        }

        trace(newPixels.length)
        for(var i = 0; i < maxPixelOffset; i++){
            Array.prototype.push.apply(newPixels, [0,0,0,0]);
        }

        // overwrite image with the edges
        context.putImageData(
            new ImageData(
            new Uint8ClampedArray(newPixels), canvas.width),
            0, 0);
    },

    applyFilter: function(f){
        f.doFilter(this);
    },

    onDetectFinished: function(magnitudes, directions){
        // pad missing edges. edge detected image will be smaller than
        // original because cannot determine edges at image edges
        var dataLength = this.canvas.width * this.canvas.height * 4;
        
        // keep edge and direction magnitude for each pixel
        this.edges = new Array(dataLength/4);
        this.directions = new Array(dataLength/4);

        var edges = new Array(dataLength);
        var i = 0;

        while(i < dataLength){
            edges[i] =  0;
            if(!(i % 4)) {
              var m = magnitudes[i / 4];
              var d = directions[i / 4];

              this.edges[i/4]       = m;
              this.directions[i/4]  = d;

              if(m != 0) {
                edges[i - 1] = m / 4;
              }
            }
            i++;
        }

        this.context.putImageData(
            new ImageData(new Uint8ClampedArray(edges), this.canvas.width, this.canvas.height),
            0, 0);
    },


    doEdgeDetect: function(ed){
        // do detection with set callbacks
        var results = ed.doDetect(this);
        var magnitudes = results[0];
        var directions = results[1];
        this.onDetectFinished(magnitudes, directions);
    },

    doEdgeThinning: function(et, onFinished){
        if(this.edges && this.edges.length > 0){
            this.edges = et.doThinning(this, this.edges, this.directions);
        }
        else{
            error('bad edges')
            
        }
    },

    doHoughTransform: function(ht){
        if(this.edges && this.edges.length > 0){
            ht.doTransform(this, this.edges);
        }
        else{
            error('bad edges')
        }
    },

    draw: function(data){
        this.context.putImageData(
            new ImageData(new Uint8ClampedArray(data), this.canvas.width, this.canvas.height),
            0, 0);
    },

    getDataArr: function(){
        // return image data as 2D array, one 4 element array per pixel
        // [[r,g,b,a],...[r,g,b,a]] for easier looping
        var imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        var data = imageData.data;

        var length = data.length;
        var arr = new Array(length / 4);
        var i = 0;
        while (i < length) {
          arr[i / 4] = [data[i], data[i+1], data[i+2], data[i+3]];
          i += 4;
        }

        return arr;
    },
    saveState: function(filename){
        // download canvas state
        var link = document.createElement('a');
        link.download = filename;
        link.href = this.canvas.toDataURL();
        link.click();
    }
}
