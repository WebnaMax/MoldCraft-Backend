export const getSectionContent = async (sectionKey) => {
    try {
        console.log(`Fetching content for section: ${sectionKey}`);
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
            console.error(`Failed to fetch section ${sectionKey}: ${response.status} ${errorText}`);
            throw new Error(`Failed to fetch section ${sectionKey}: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        console.log(`Received content for ${sectionKey}:`, data);
        return data.content || null;
    } catch (err) {
        console.error(`Error fetching section ${sectionKey}:`, err.message);
        throw err;
    }
};