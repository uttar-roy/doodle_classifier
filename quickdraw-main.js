/*
variables
*/
var model;
var canvas;
var classNames =  [  
    'ট্র্যাফিক লাইট',
    'সাপ',
    'মেঘ',
    'পাওয়ার আউটলেট',
    'তাঁবু',
    'চশমা',
    'সিলিং ফ্যান',
    'পেপার ক্লিপ',
    'দাড়ি',
    'চামচ',
    'আইসক্রীম',
    'স্মাইলি',
    'পেনসিল',
    'ফুল',
    'অ্যালার্ম ঘড়ি',
    'সেতু',
    'বেতার',
    'সিরিঞ্জ',
    'রাইফেল',
    'ছুরি',
    'টি-শার্ট',
    'মুখ',
    'মোমবাতি',
    'দাঁত',
    'বেঞ্চ',
    'পাখি',
    'মই',
    'হট-ডগ',
    'তরোয়াল',
    'সূর্য',
    'শিরস্ত্রাণ',
    'বাস্কেটবল',
    'বালুসাই',
    'হাতুড়ি',
    'হেডফোন',
    'ঝাঁটা',
    'ললিপপ',
    'বেসবল',
    'ড্রামস',
    'চাকা',
    'বিড়াল',
    'মাকড়সা',
    'ঘড়ি',
    'আঙুর',
    'চেয়ার',
    'দরজা',
    'গোঁফ',
    'চোখ',
    'দ্বিচক্রযান',
    'কফি-কাপ',
    'ছাতা',
    'নেহাই',
    'কাঁচি',
    'ত্রিভুজ',
    'খাট',
    'বাল্ব',
    'ল্যাপটপ',
    'খাম',
    'বৃত্ত',
    'স্যুটকেস',
    'ক্যামেরা',
    'বালিশ',
    'ডাইভিং-বোর্ড',
    'রামধনু',
    'প্যান্ট',
    'পাউরুটি',
    'করাত',
    'রেখা',
    'মাইক্রোফোন',
    'স্ক্রু-ড্রাইভার',
    'চাবি',
    'ফ্রাইং-প্যান',
    'চতুর্ভূজ',
    'যতি-চিহ্ন',
    'বাজ',
    'পিৎজা',
    'কাপ',
    'কুকি',
    'আপেল',
    'মোজা',
    'ফ্যান',
    'শর্টস',
    'কুঠার',
    'বিমান',
    'প্রজাপতি',
    'র্যাকেট',
    'গাছ',
    'টুপি',
    'বই',
    'বেলচা',
    'মাশরুম',
    'ডাম্বেল',
    'ফোন',
    'হাতঘড়ি',
    'বেসবল-ব্যাট',
    'গাড়ি',
    'পাহাড়',
    'চাঁদ',
    'টেবিল',
    'তারা'
    ];
var canvas;
var coords = [];
var mousePressed = false;
var mode;

async function sleep(){
    await new Promise(r => setTimeout(r, 2000));
}


/*
prepare the drawing canvas 
*/
$(function() {
    canvas = window._canvas = new fabric.Canvas('canvas');
    canvas.backgroundColor = '#ffffff';
    canvas.isDrawingMode = 0;
    canvas.freeDrawingBrush.color = "black";
    canvas.freeDrawingBrush.width = 10;
    canvas.renderAll();
    //setup listeners 
    canvas.on('mouse:up', function(e) {
        getFrame();
        mousePressed = false;
    });
    canvas.on('mouse:down', function(e) {
        mousePressed = true;
    });
    canvas.on('mouse:move', function(e) {
        recordCoor(e);
    });
})

/*
set the table of the predictions 
*/
function setTable(top5, probs) {
    update_pie_chart(top5, probs);
}

/*
record the current drawing coordinates
*/
function recordCoor(event) {
    var pointer = canvas.getPointer(event.e);
    var posX = pointer.x;
    var posY = pointer.y;

    if (posX >= 0 && posY >= 0 && mousePressed) {
        coords.push(pointer)
    }
}

/*
get the best bounding box by trimming around the drawing
*/
function getMinBox() {
    //get coordinates 
    var coorX = coords.map(function(p) {
        return p.x
    });
    var coorY = coords.map(function(p) {
        return p.y
    });

    //find top left and bottom right corners 
//    var min_coords = {
//        x: Math.min.apply(null, coorX),
//        y: Math.min.apply(null, coorY)
//    }
//    var max_coords = {
//        x: Math.max.apply(null, coorX),
//        y: Math.max.apply(null, coorY)
//    }
    var min_coords = {
        x: 20.0,
        y: 20.0
    }
    var max_coords = {
        x: 280.0,
        y: 280.0
    }

    //return as strucut 
    return {
        min: min_coords,
        max: max_coords
    }
}

/*
get the current image data 
*/
function getImageData() {
        //get the minimum bounding box around the drawing 
        const mbb = getMinBox();


        //get image data according to dpi 
        const dpi = window.devicePixelRatio

        const imgData = canvas.contextContainer.getImageData(mbb.min.x * dpi, mbb.min.y * dpi,
                                                      (mbb.max.x - mbb.min.x) * dpi, (mbb.max.y - mbb.min.y) * dpi);
        return imgData
    }

/*
get the prediction 
*/
function getFrame() {
    //make sure we have at least two recorded coordinates
    if (coords.length >= 2) {
        //get the image data from the canvas
        const imgData = getImageData()


        //get the prediction
        const pred = model.predict(preprocess(imgData)).dataSync()

        //find the top 5 predictions
        const indices = findIndicesOfMax(pred, 5)
        const probs = findTopValues(pred, 5)
        const names = getClassNames(indices)

        //set the table
        setTable(names, probs)
    }

}

/*
get the the class names 
*/
function getClassNames(indices) {
    var outp = []
    for (var i = 0; i < indices.length; i++)
        outp[i] = classNames[indices[i]]
    return outp
}

/*
load the class names 
*/
// async function loadDict() {
//       loc = 'http://127.0.0.1:5000/class_names'
//       loc = 'models/class_names.txt'

//     await $.ajax({
//         url: loc,
//         dataType: 'text',
//     }).done(success);
// }

/*
load the class names
*/
// function success(data) {
//     const lst = data.split(/\n/)
//     for (var i = 0; i < lst.length - 1; i++) {
//         let symbol = lst[i]
//         classNames[i] = symbol
//     }
// }

/*
get indices of the top probs
*/
function findIndicesOfMax(inp, count) {
    var outp = [];
    for (var i = 0; i < inp.length; i++) {
        outp.push(i); // add index to output array
        if (outp.length > count) {
            outp.sort(function(a, b) {
                return inp[b] - inp[a];
            }); // descending sort the output array
            outp.pop(); // remove the last index (index of smallest element in output array)
        }
    }
    return outp;
}

/*
find the top 5 predictions
*/
function findTopValues(inp, count) {
    var outp = [];
    let indices = findIndicesOfMax(inp, count)
    // show 5 greatest scores
    for (var i = 0; i < indices.length; i++)
        outp[i] = inp[indices[i]]
    return outp
}

/*
preprocess the data
*/
function preprocess(imgData) {
    return tf.tidy(() => {
        //convert to a tensor 
        let tensor = tf.browser.fromPixels(imgData, numChannels = 1)
        
        //resize 
        const resized = tf.image.resizeBilinear(tensor, [28, 28]).toFloat()
//        console.log(tensor);
//        console.log(resized);
//        resized.print();
//        var a_f = tensor.array().then(array => console.log(array.toString()));

//        resized.array().then(array => console.log(array.toString()));

        //normalize 
        const offset = tf.scalar(255.0);
        const normalized = tf.scalar(1.0).sub(resized.div(offset));

        //We add a dimension to get a batch shape 
        const batched = normalized.expandDims(0)
        return batched
    })
}

/*
load the model
*/
async function start() {

    
    //load the model 
     model = await tf.loadLayersModel('models/model.json')

    //warm up 
    model.predict(tf.zeros([1, 28, 28, 1]))
    
    //allow drawing on the canvas 
    allowDrawing()
    
    //load the class names
    await loadDict()
}

/*
allow drawing on canvas
*/
function allowDrawing() {
    canvas.isDrawingMode = 1;
    document.getElementById('status').innerHTML = 'প্রস্তুত';
    $('button').prop('disabled', false);
    var slider = document.getElementById('myRange');
    slider.oninput = function() {
        canvas.freeDrawingBrush.width = this.value;
    };
}

/*
clear the canvs 
*/
function erase() {
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    coords = [];
}

function get_chart_data(top5, probs){
    let data = [];

    for(let i=0; i<top5.length; i++){
        data.push({'category':top5[i], 'probability': probs[i]*100.0});
    }
    console.log(data);
    return data;

}

function update_pie_chart(top5, probs){
am4core.useTheme(am4themes_animated);
    // Themes end

    // Create chart instance
    var chart = am4core.create("pie_chart", am4charts.PieChart);
    am_piechart = chart;

    // Add and configure Series
    var pieSeries = chart.series.push(new am4charts.PieSeries());
    pieSeries.dataFields.value = "probability";
    pieSeries.dataFields.category = "category";
    pieSeries.dataFields.radiusValue = "probability";

    pieSeries.slices.template.cornerRadius = 6;
    pieSeries.colors.step = 3;

    pieSeries.hiddenState.properties.endAngle = -90;
    // Let's cut a hole in our Pie chart the size of 30% the radius
    chart.innerRadius = am4core.percent(10);

    // Put a thick white border around each Slice
    pieSeries.slices.template.stroke = am4core.color("#fff");
    pieSeries.slices.template.strokeWidth = 2;
    pieSeries.slices.template.strokeOpacity = 1;
    pieSeries.slices.template
      // change the cursor on hover to make it apparent the object can be interacted with
      .cursorOverStyle = [
        {
          "property": "cursor",
          "value": "pointer"
        }
      ];

//    pieSeries.alignLabels = false;
////    pieSeries.labels.template.bent = false;
//    pieSeries.labels.template.radius = 3;
//    pieSeries.labels.template.padding(0,0,0,0);
//
//    pieSeries.ticks.template.disabled = true;

    // Create a base filter effect (as if it's not there) for the hover to return to
    var shadow = pieSeries.slices.template.filters.push(new am4core.DropShadowFilter);
    shadow.opacity = 0;

    // Create hover state
    var hoverState = pieSeries.slices.template.states.getKey("hover"); // normally we have to create the hover state, in this case it already exists

    // Slightly shift the shadow and make it more prominent on hover
    var hoverShadow = hoverState.filters.push(new am4core.DropShadowFilter);
    hoverShadow.opacity = 0.7;
    hoverShadow.blur = 5;

    // Add a legend
    chart.legend = new am4charts.Legend();

    chart.data = get_chart_data(top5, probs);
}


// $('#examples_button').click(function () {
//    console.log("clicked");
//    alert('wjeygf');
// });


function goToByScroll(id) {
    // Remove "link" from the ID
    id = id.replace("link", "");
    // Scroll
    $('html,body').animate({
        scrollTop: $("#" + id).offset().top
    }, 'slow');
}