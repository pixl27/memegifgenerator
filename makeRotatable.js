    makeRotatable(element, overlay, rotateHandle) {
        rotateHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Mark element as selected
            this.selectTextOverlay(element, overlay);

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const startAngle = Math.atan2(
                e.clientY - centerY,
                e.clientX - centerX
            ) * 180 / Math.PI;
            
            const startRotation = overlay.rotation || 0;

            const onMouseMove = (e) => {
                const angle = Math.atan2(
                    e.clientY - centerY,
                    e.clientX - centerX
                ) * 180 / Math.PI;
                
                const newRotation = (startRotation + angle - startAngle) % 360;
                
                overlay.rotation = newRotation;
                element.style.transform = `rotate(${newRotation}deg)`;
                this.drawCurrentFrame();
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
