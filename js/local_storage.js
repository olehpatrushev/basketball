export const extractDataFromLocalStorage = function () {
    // Получаем данные из localStorage по ключу 'air'
    const airData = JSON.parse(localStorage.getItem('air'));

    if (!airData) {
        console.error('No data found in localStorage with key "air"');
        return null;
    }

    // Инициализируем объект для сохранения извлеченных данных
    const extractedData = {
        type: airData.playlist.type,
        sponsorZones: {
            sponsorZone1: {
                id: airData.playlist.sponsorZone1.id,
                sponsorId: airData.playlist.sponsorZone1.sponsorId,
                graphicPathFilename: airData.playlist.sponsorZone1.graphicPathFilename
            },
            sponsorZone2: {
                id: airData.playlist.sponsorZone2.id,
                sponsorId: airData.playlist.sponsorZone2.sponsorId,
                graphicPathFilename: airData.playlist.sponsorZone2.graphicPathFilename
            },
            sponsorZone3: {
                id: airData.playlist.sponsorZone3.id,
                sponsorId: airData.playlist.sponsorZone3.sponsorId,
                graphicPathFilename: airData.playlist.sponsorZone3.graphicPathFilename
            }
        },
        player: null,
        gameId: airData.gameId,
        teamId: airData.teamId,
        color: null,
        logoId: null
    };

    // Поиск первого игрока из homeTeamPlayers или awayTeamPlayers
    const firstHomePlayer = airData.playlist.homeTeamPlayers.length > 0 ? airData.playlist.homeTeamPlayers[0] : null;
    const firstAwayPlayer = airData.playlist.awayTeamPlayers.length > 0 ? airData.playlist.awayTeamPlayers[0] : null;

    const selectedPlayer = firstHomePlayer || firstAwayPlayer;

    // Если найден игрок, заполняем информацию
    if (selectedPlayer) {
        extractedData.player = {
            id: selectedPlayer.id,
            first_name: selectedPlayer.first_name,
            last_name: selectedPlayer.last_name,
            jersey_number_str: selectedPlayer.jersey_number_str,
            image_light: selectedPlayer.team_player_images.image_light
        };

        // Определяем teamId и color в зависимости от команды игрока
        if (firstHomePlayer && airData.homeTeamColor) {
            extractedData.color = `#${airData.homeTeamColor.color}`; // цвет домашней команды с символом #
            if (extractedData.homeTeamImage) {
                extractedData.logoId = extractedData.homeTeamImage;
            }

        } else if (firstAwayPlayer && airData.awayTeamColor) {
            extractedData.color = `#${airData.awayTeamColor.color}`; // цвет выездной команды с символом #
            if (extractedData.awayTeamImage) {
                extractedData.logoId = extractedData.awayTeamImage;
            }
        }
    }

    return extractedData;
}