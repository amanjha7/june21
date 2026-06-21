const signs = [
    { name: 'Aries', start: [3, 21], end: [4, 19], prediction: 'A day of new beginnings and high energy awaits you.' },
    { name: 'Taurus', start: [4, 20], end: [5, 20], prediction: 'Focus on stability and comfort today. Financial gains are possible.' },
    { name: 'Gemini', start: [5, 21], end: [6, 20], prediction: 'Communication is key today. Reach out to old friends.' },
    { name: 'Cancer', start: [6, 21], end: [7, 22], prediction: 'Emotional connections will be strong. Trust your intuition.' },
    { name: 'Leo', start: [7, 23], end: [8, 22], prediction: 'Your leadership qualities will shine. Be confident in your decisions.' },
    { name: 'Virgo', start: [8, 23], end: [9, 22], prediction: 'Attention to detail will lead to success in your current project.' },
    { name: 'Libra', start: [9, 23], end: [10, 22], prediction: 'Balance and harmony are within reach. Seek compromise in conflicts.' },
    { name: 'Scorpio', start: [10, 23], end: [11, 21], prediction: 'Transformation is coming. Embrace change with an open mind.' },
    { name: 'Sagittarius', start: [11, 22], end: [12, 21], prediction: 'Adventure calls! Explore new ideas or places today.' },
    { name: 'Capricorn', start: [12, 22], end: [1, 19], prediction: 'Hard work will pay off. Stay disciplined and focused on your goals.' },
    { name: 'Aquarius', start: [1, 20], end: [2, 18], prediction: 'Your original ideas will be appreciated. Share them with the world.' },
    { name: 'Pisces', start: [2, 19], end: [3, 20], prediction: 'Creativity and compassion are your strengths today. Help someone in need.' }
];

const calculateZodiac = (date) => {
    const month = date.getMonth() + 1; // getMonth() is 0-indexed
    const day = date.getDate();

    const sign = signs.find(s => {
        const [sMonth, sDay] = s.start;
        const [eMonth, eDay] = s.end;

        if (month === sMonth && day >= sDay) return true;
        if (month === eMonth && day <= eDay) return true;
        return false;
    });

    return sign ? sign.name : 'Unknown';
};

const getPrediction = (zodiacName) => {
    const sign = signs.find(s => s.name === zodiacName);
    return sign ? sign.prediction : 'Consult an expert for a detailed reading.';
};

module.exports = { calculateZodiac, getPrediction };
