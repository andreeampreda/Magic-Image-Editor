const fotoFile=document.getElementById("foto-file");
const canvas=document.getElementById("canvas");
const ctx=canvas.getContext('2d');

const buttons={
    crop: document.querySelector('.crop-button'),
    reset: document.querySelector('.reset-button'),
    save: document.querySelector('.save-button'),
    select: document.querySelector('.select-button'),
    deleteSelection: document.querySelector('.deleteSelection-button'),
    resize: document.querySelector('.resize-button'),
    applyResize: document.getElementById('apply-resize'),
    effect: document.querySelectorAll('.btn-effect'),
    text: document.querySelector('.text-button'),
    applyText: document.getElementById('apply-text')
};

let state = {
    Img: null,
    initialImg: null,
    isCropping: false,
    isSelecting: false,
    isDragging: false,
    selectionRect: {x: 0, y: 0, width: 0, height: 0},
    startPos: {x: 0, y:0},
};

const inputs={
        resizeWidth: document.getElementById("resize-width"),
        resizeHeight: document.getElementById("resize-height"),
        resizeContainer: document.querySelector(".resize-container"),
        textContainer: document.querySelector(".text-inputs"),
        textContent: document.getElementById("text-content"),
        textSize: document.getElementById('text-size'),
        textColor: document.getElementById('text-color'),
        textX: document.getElementById('text-x'),
        textY: document.getElementById('text-y')
};

function updateCanvasState() {
    state.Img = new Image();
    state.Img.src = canvas.toDataURL();
}

function drawSelectionRect(){
    ctx.strokeStyle= 'blue';
    ctx.lineWidth=2;
    ctx.strokeRect(state.selectionRect.x, 
                    state.selectionRect.y, 
                    state.selectionRect.width, 
                    state.selectionRect.height);
}

function redrawCanvas(){
        if(state.Img){
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(state.Img, 0, 0, canvas.width, canvas.height);
        }
}

function crop(){
    if(!state.selectionRect.width || !state.selectionRect.height) return;

    const croppedImage=ctx.getImageData(
        state.selectionRect.x,
        state.selectionRect.y,
        state.selectionRect.width,
        state.selectionRect.height
    );

    canvas.width=state.selectionRect.width;
    canvas.height=state.selectionRect.height;

    ctx.putImageData(croppedImage, 0, 0);

    updateCanvasState();

    state.selectionRect= {x: 0, y: 0, width: canvas.width, height: canvas.height};
}

function applyEffect(effect){
    if (!state.selectionRect.width || !state.selectionRect.height) {
        console.warn('Nu există o selecție validă pentru efect!');
        return;
    }

    const imageData = ctx.getImageData(
        state.selectionRect.x,
        state.selectionRect.y,
        state.selectionRect.width,
        state.selectionRect.height
    );

    const data = imageData.data; 

    switch (effect) {
        case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;       
                data[i + 1] = avg;   
                data[i + 2] = avg;   
            }
            break;
        
        case 'brightness':
            for (let i = 0; i < data.length; i += 4) {
                data[i] += 40;       
                data[i + 1] += 40;  
                data[i + 2] += 40;   
            }
            break;
        
        case 'contrast':
            const contrast = 1.5; 
            const intercept = 128 * (1 - contrast);
            for (let i = 0; i < data.length; i += 4) {
                data[i] = contrast * data[i] + intercept;       
                data[i + 1] = contrast * data[i + 1] + intercept; 
                data[i + 2] = contrast * data[i + 2] + intercept; 
            }
            break;
        
        case 'posterize':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = (data[i] >> 5) << 5;      
                data[i + 1] = (data[i + 1] >> 5) << 5; 
                data[i + 2] = (data[i + 2] >> 5) << 5; 
            }
            break;
        
        case 'blue':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 0;         
                data[i + 1] = 0;     
                data[i + 2] = data[i + 2]; 
            }
            break;

        default:
            console.warn('Efect necunoscut:', effect);
    }

    ctx.putImageData(imageData, state.selectionRect.x, state.selectionRect.y);

    updateCanvasState();
}

function getTextSettings() {
    return {
        text: inputs.textContent.value.trim() || 'Text implicit',
        fontSize: Number(inputs.textSize.value) || 20,
        color: inputs.textColor.value || '#000000',
        x: Number(inputs.textX.value) || 100,
        y: Number(inputs.textY.value) || 100
    };
}

function drawTextOnCanvas({ text, fontSize, color, x, y }) {
    if (!state.Img) {
        console.warn('Nu există o imagine pe canvas pentru a adăuga text.');
        return;
    }

    ctx.save(); 
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore(); 

    updateCanvasState();
}


fotoFile.addEventListener('change', (e)=>{
    const file=e.target.files[0];
    if(file){
        const reader=new FileReader();
        reader.onload= (e) =>{
            const img = new Image();

            img.onload= function(){
                const maxCanvasWidth=800;
                const maxCanvasHeight=600;

                const scaleWidth= maxCanvasWidth/img.width;
                const scaleHeight=maxCanvasHeight/img.height;
                const scale=Math.min(scaleWidth, scaleHeight, 1);

                canvas.width=img.width*scale;
                canvas.height=img.height*scale;
                ctx.clearRect(0,0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                state.Img=img;
                state.initialImg=new Image();
                state.initialImg.src = e.target.result;
            };
            img.src=e.target.result;
        };
        reader.readAsDataURL(file);
    }
    else{
        console.warn("Nu a fost selectata nicio imagine.")
    }
});

canvas.addEventListener('mousedown', (e)=>{
    if(state.isSelecting || state.isCropping){
        state.isDragging=true;
        state.startPos= {x: e.offsetX, y: e.offsetY};
    }
});

canvas.addEventListener('mousemove', (e)=>{
    if(state.isDragging && (state.isCropping || state.isSelecting)){
        const currentX= e.offsetX;
        const currentY=e.offsetY;

        state.selectionRect={
            x: Math.min(state.startPos.x, currentX),
            y: Math.min(state.startPos.y, currentY),
            width: Math.abs(currentX-state.startPos.x),
            height: Math.abs(currentY-state.startPos.y)
        };
        redrawCanvas();
        drawSelectionRect();
    }
});

canvas.addEventListener('mouseup', (e)=>{
    if(state.isDragging && state.isCropping){
        crop();
        state.isDragging=false;
        state.isCropping=false;
        buttons.crop.classList.remove('active');

    }

    if(state.isDragging && state.isSelecting){
        state.isDragging=false;
    }
});

buttons.crop.addEventListener('click', ()=>{
    state.isCropping=!state.isCropping;
    state.isSelecting=false;

    buttons.crop.classList.toggle('active', state.isCropping);
    buttons.select.classList.remove('active');
    canvas.style.cursor= state.isCropping ? 'crosshair' : 'default';

});

buttons.save.addEventListener('click', ()=>{
    if (!canvas) {
        console.warn('Canvas-ul nu a fost găsit!');
        return;
    }
    const link = document.createElement('a');
    link.download = 'canvas-image.png'; 
    link.href = canvas.toDataURL('image/png'); 
    link.click(); 

    console.log('Imaginea a fost salvată.');
});

buttons.reset.addEventListener('click', ()=>{
    if(!state.initialImg){
        console.warn('Don t exist a original image');
        return;
    }

   
    const img = new Image();
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        state.Img = img;

        state.selectionRect = { x: 0, y: 0, width: 0, height: 0 };
        state.isSelecting = false;
        state.isCropping = false;
        state.isDragging = false;

        buttons.crop.classList.remove('active');
        buttons.select.classList.remove('active');

        updateCanvasState();

        console.log('Canvas-ul a fost resetat la starea inițială.');
    };

    img.src = state.initialImg.src;
    
});

buttons.select.addEventListener('click', ()=>{
    state.isSelecting=!state.isSelecting;
    state.isCropping=false;
    
    buttons.select.classList.toggle('active', state.isSelecting);
    buttons.crop.classList.remove('active');
    state.selectionRect={ x: 0, y:0, width: canvas.width, height:canvas.height};

});

buttons.deleteSelection.addEventListener('click', ()=> {
    if(!state.selectionRect.width || !state.selectionRect.height) return;

    const imageData= ctx.getImageData(
        state.selectionRect.x,
        state.selectionRect.y,
        state.selectionRect.width,
        state.selectionRect.height
    );

    for(let i=0; i< imageData.data.length; i+=4){
        imageData.data[i]=255;
        imageData.data[i+1]=255;
        imageData.data[i+2]=255;
        imageData.data[i+3]=255;
    }

    ctx.putImageData(imageData, state.selectionRect.x, state.selectionRect.y);

    const updateImage=canvas.toDataURL();
    const newImg= new Image();
    newImg.onload= () =>{
        state.Img= newImg;
        state.selectionRect={x: 0, y:0, width: 0, height:0 };
        state.isCropping=false;
        state.isSelecting=false;
        
        redrawCanvas();
    };

    newImg.src= updateImage;
});

buttons.resize.addEventListener('click', () => {
    inputs.resizeContainer.classList.toggle('hidden');
});

buttons.applyResize.addEventListener('click', ()=>{
    if(!state.Img)return;

    const newWidth=parseFloat(inputs.resizeWidth.value) || null;
    const newHeight=parseFloat(inputs.resizeHeight.value) || null;

    if(!newWidth && !newHeight) return;

    let fWidth=canvas.width;
    let fHeight=canvas.height;

    if(!newHeight && newWidth){
        fWidth=newWidth;
        fHeight= (state.Img.height/state.Img.width)*newWidth;
    }else if (newHeight && !newWidth) {
        fHeight = newHeight;
        fWidth = (state.Img.width / state.Img.height) * newHeight;
    } else if (newWidth && newHeight) {
        fWidth = newWidth;
        fHeight=newHeight;
    }

    canvas.width = fWidth;
    canvas.height = fHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(state.Img, 0, 0, fWidth, fHeight);


    updateCanvasState();

    inputs.resizeHeight.value = '';
    inputs.resizeWidth.value = '';
    inputs.resizeContainer.classList.add('hidden');
});

buttons.effect.forEach(button => {
    button.addEventListener('click', ()=>{
        const effect=button.getAttribute('data-effect');
        applyEffect(effect);
    });
});

buttons.text.addEventListener('click', ()=>{
    inputs.textContainer.classList.toggle('hidden');
});

buttons.applyText.addEventListener('click', () => {
    const settings = getTextSettings();
    drawTextOnCanvas(settings);
    inputs.textContainer.classList.add('hidden');
});