export const getSectionContent = async (sectionKey) => {
    try {
        const response = await fetch(`https://moldcraft-backend.onrender.com/api/content/section/${sectionKey}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch section ${sectionKey}: ${response.statusText}`);
        }
        const data = await response.json();
        return data.content || null;
    } catch (err) {
        console.error(`Error fetching section ${sectionKey}:`, err);
        throw err;
    }
};