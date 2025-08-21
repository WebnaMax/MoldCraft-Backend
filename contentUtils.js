export const getSectionContent = async (sectionKey, retries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Attempt ${attempt} to fetch content for ${sectionKey} from server at ${new Date().toISOString()}`);
            const response = await fetch(`https://moldcraft-backend.onrender.com/api/content/section/${sectionKey}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer admin999',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to fetch ${sectionKey} (status: ${response.status}): ${errorText} at ${new Date().toISOString()}`);
                throw new Error(`Failed to fetch ${sectionKey}: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            console.log(`Successfully fetched content for ${sectionKey} from server at ${new Date().toISOString()}:`, data);
            return data.content || null;
        } catch (err) {
            if (attempt === retries) {
                console.error(`Error fetching ${sectionKey} after ${retries} attempts:`, err.message);
                throw err;
            }
            console.warn(`Retry ${attempt}/${retries} failed for ${sectionKey}: ${err.message}`);
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }
};