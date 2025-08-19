export const getSectionContent = async (sectionKey) => {
    try {
        const response = await fetch(`https://moldcraft-backend.onrender.com/api/content/section/${sectionKey}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin999',
            },
            cache: 'no-store', // Отключаем кэш браузера
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch content for ${sectionKey}: ${response.status}`);
        }
        const data = await response.json();
        return data.content || {};
    } catch (err) {
        console.error(`Ошибка загрузки контента для ${sectionKey}:`, err);
        return {};
    }
};