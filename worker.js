import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Skip local check to ensure we use the CDN models
env.allowLocalModels = false;

let generator = null;

self.onmessage = async (e) => {
    const { type, data } = e.data;

    if (type === 'load') {
        try {
            if (!generator) {
                console.log('Worker: Loading model...');
                generator = await pipeline('text-generation', 'Xenova/Qwen1.5-0.5B-Chat', { 
                    quantized: true,
                    progress_callback: (p) => {
                        console.log(`Worker: Loading progress: ${Math.round(p.progress)}%`);
                    }
                });
                console.log('Worker: Model loaded successfully');
            }
            self.postMessage({ type: 'status', data: 'ready' });
        } catch (error) {
            console.error('Worker: Model loading error:', error);
            self.postMessage({ type: 'error', data: error.message });
        }
    } else if (type === 'generate') {
        try {
            if (!generator) {
                throw new Error('Model not loaded');
            }

            const { prompt, params } = data;
            console.log('Worker: Starting generation...');
            const output = await generator(prompt, params);
            console.log('Worker: Generation complete');
            
            self.postMessage({ type: 'result', data: output });
        } catch (error) {
            console.error('Worker: Generation error:', error);
            self.postMessage({ type: 'error', data: error.message });
        }
    }
};
