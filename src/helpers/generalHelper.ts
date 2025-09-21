export async function fetchApi(url: string, options: RequestInit) : Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const apiUrl = `${baseUrl}/api/${url}`;
    
    try {
        const response = await fetch(apiUrl, options);
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: errorText || 'Erro na requisição' };
            }
            throw new Error(errorData.error || `Erro ${response.status}`);
        }
        
        const responseText = await response.text();
        if (!responseText) {
            return {};
        }
        
        try {
            return JSON.parse(responseText);
        } catch (e) {
            console.error('Error parsing JSON response:', e, 'Response:', responseText);
            throw new Error('Resposta inválida do servidor');
        }
    } catch (error) {
        console.error('Fetch API error:', error, 'URL:', apiUrl);
        throw error;
    }
}