
class HandControls {
    constructor(videoElement) {
        
        //API
        this.estimationConfig = {flipHorizontal: true};

        this.videoElement = videoElement;
        this.isEstimating = false;
        this.selectedHandedness = "Right";
        this.visibleHands = 0;
        this.secondHandPresent = false;
        this.detector = null;

        const scope = this;

        const model = handPoseDetection.SupportedModels.MediaPipeHands;

        const detectorConfig = {
            runtime: 'mediapipe', // or 'tfjs',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
            modelType: 'full'
        };
        

        handPoseDetection.createDetector(model, detectorConfig)
            .then((detector) => {
                console.log("Detector loaded")
                scope.detector = detector
            })

        this.pointer = {x: window.innerWidth/2, y: window.innerHeight/2}
        this.thumbIndexDistance = 0;
    }

    start() {

        this.isEstimating = true;

        // Requesting access to the user's camera
        navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            // Setting the video element's source to the user's camera stream

            //FIX NEEDED: dynamic video selection
            this.videoElement = document.querySelector("video");
            this.videoElement.srcObject = stream;
            this.videoElement.play() 
            setTimeout(() => this.estimateHands(), 1000)
        })
        .catch(error => {
            console.error('Error accessing user media:', error);
        });
        
    }

    stop() {
        this.videoElement.srcObject.getTracks()[0].stop();
        this.isEstimating = false;
    }

    estimateHands() {
        if(!this.isEstimating) return;
        if(!this.detector) {
            console.log("Awaiting detector to load.")
            setTimeout(()=> this.estimateHands(), 100);
            return;
        }

        this.detector.estimateHands(this.videoElement, this.estimationConfig)
        .then((hands) => {
            
            this.visibleHands = hands.length;
            let controlHand = null;
            let secondHand = null;
            let secondHandPresent = false;

            hands.forEach((hand) => {
                if(hand.handedness === this.selectedHandedness) {
                    controlHand = hand;
                } else {
                    secondHand = hand;
                    secondHandPresent = true;
                }
            })

            this.secondHandPresent = secondHandPresent;
            
            if(controlHand) {

                let indexFingerPosition = {x: 0, y:0, z: 0}
                let thumbPosition = {x: 0, y:0, z: 0}

                let keypoints = controlHand.keypoints;
                keypoints.forEach(element => {
                    if(element.name === "index_finger_tip") {
                        this.updatePointer(element.x, element.y)
                    }
                });

                
                

                
            } else {
                this.pointer = {x: window.innerWidth/2, y: window.innerHeight/2}
            }

            if(secondHand) {
                secondHand.keypoints.forEach(element => {
                    if(element.name === "index_finger_tip") {

                        const newX = (element.x)/this.videoElement.videoWidth * window.innerWidth;
                        const newY = (element.y)/this.videoElement.videoHeight * window.innerHeight;
                        console.log(newX)
                        console.log(newY)
                        applyParallax(newX, newY)

                    }
                })
            }
            
        })

        setTimeout(() => this.estimateHands(), 16)
    }

    updatePointer(x, y) {
        
        const newX = (x)/this.videoElement.videoWidth * window.innerWidth;
        const newY = (y)/this.videoElement.videoHeight * window.innerHeight;
            
        this.pointer.x = newX;
        this.pointer.y = newY;

        const slider = document.getElementById('seasonSlider');
        slider.value = newX / window.innerWidth * slider.max
        const event = new Event('input', { bubbles: true });

        slider.dispatchEvent(event);


        /*const handPointerElement = document.getElementById("handPointer");
        const handPointerWidthHalved = handPointerElement.getBoundingClientRect().width / 2;

        if(handPointerElement) {
            handPointerElement.style.transform = "translate(" + (newX - handPointerWidthHalved) + "px, " + (newY - handPointerWidthHalved) + "px)";
        }*/

    }
}

document.addEventListener('DOMContentLoaded', function() {
    const handControls = new HandControls(document.querySelector("video"))
    document.getElementById('handToggle').addEventListener('click', () => {
        if(handControls.isEstimating) {
            handControls.stop()
        } else {
            handControls.start()
        }
    })
    
})
