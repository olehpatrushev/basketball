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
            sponsorZone1: null,
            sponsorZone2: null,
            sponsorZone3: null
        },
        player: null,
        gameId: airData.gameId,
        teamId: airData.teamId,
        color: null,
        logoId: null
    };

    if (airData.playlist.sponsorZone1 && airData.playlist.sponsorZone1.id) {
        extractedData.sponsorZones.sponsorZone1 = {
            id: airData.playlist.sponsorZone1.id,
            sponsorId: airData.playlist.sponsorZone1.sponsorId,
            graphicPathFilename: airData.playlist.sponsorZone1.graphicPathFilename
        }
    }
    if (airData.playlist.sponsorZone2 && airData.playlist.sponsorZone2.id) {
        extractedData.sponsorZones.sponsorZone2 = {
            id: airData.playlist.sponsorZone2.id,
            sponsorId: airData.playlist.sponsorZone2.sponsorId,
            graphicPathFilename: airData.playlist.sponsorZone2.graphicPathFilename
        }
    }
    if (airData.playlist.sponsorZone3 && airData.playlist.sponsorZone3.id) {
        extractedData.sponsorZones.sponsorZone3 = {
            id: airData.playlist.sponsorZone3.id,
            sponsorId: airData.playlist.sponsorZone3.sponsorId,
            graphicPathFilename: airData.playlist.sponsorZone3.graphicPathFilename
        }
    }
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
            if (airData.homeTeamImage) {
                extractedData.logoId = airData.homeTeamImage;
            }

        } else if (firstAwayPlayer && airData.awayTeamColor) {
            extractedData.color = `#${airData.awayTeamColor.color}`; // цвет выездной команды с символом #
            if (airData.awayTeamImage) {
                extractedData.logoId = airData.awayTeamImage;
            }
        }
    }

    return extractedData;
}