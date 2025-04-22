function weatherApp() {
  return {
    loaded: false,
    current: {
      description: "Loading...",
      temperature: "--°F",
      feels_like: "--°F",
      wind_speed: "-- mph",
      wind_direction: "",
      wind_gust: "-- mph",
      air_quality: "N/A",
      icon: "",
    },
    position: null,
    forecast: [],
    stationName: "",
    init() {
      // Check for CORS issues in development and secure endpoints in production.
      // These endpoints use a sample gridpoint. You may wish to update these coordinates.
      const currentUrl =
        "https://api.weather.gov/stations/KAVP/observations/latest";
      const hourlyUrl = "https://api.weather.gov/gridpoints/BGM/65,32/forecast";

      // this.fetchCurrent(currentUrl);
      // this.fetchHourly(hourlyUrl);
      navigator.geolocation.getCurrentPosition(async (position) => {
        console.log("Position:", position);
        this.position = position;
        this.fetchWeather();
      });
    },
    calculateFeelsLikeTempC(tempC, dewPointC) {
      // Step 1: Compute relative humidity
      const e_dp = 6.11 * Math.pow(10, (7.5 * dewPointC) / (237.7 + dewPointC));
      const e_t = 6.11 * Math.pow(10, (7.5 * tempC) / (237.7 + tempC));
      const RH = 100 * (e_dp / e_t);

      // Step 2: Convert to Fahrenheit
      const T = (tempC * 9) / 5 + 32;

      if (T < 80 || RH < 40) {
        return tempC; // Heat index formula not valid below these values
      }

      // Step 3: Apply Heat Index formula
      const HI =
        -42.379 +
        2.04901523 * T +
        10.14333127 * RH -
        0.22475541 * T * RH -
        0.00683783 * T * T -
        0.05481717 * RH * RH +
        0.00122874 * T * T * RH +
        0.00085282 * T * RH * RH -
        0.00000199 * T * T * RH * RH;

      // Convert back to Celsius
      const HI_C = ((HI - 32) * 5) / 9;
      return HI_C;
    },
    async fetchPoints() {
      const lat = this.position.coords.latitude;
      const lon = this.position.coords.longitude;
      const pointResponse = await fetch(
        `https://api.weather.gov/points/${lat},${lon}`
      );
      const pointData = await pointResponse.json();
      console.log("Point Data:", pointData);
      return pointData;
    },
    async fetchFirstStation(stationUrl) {
      const stationResponse = await fetch(stationUrl);
      const stationData = await stationResponse.json();
      console.log("Station Data:", stationData);
      const firstStation = stationData.features[0];
      console.log("First Station:", firstStation);
      return firstStation;
    },
    async fetchWeather() {
      console.log("Fetching weather data...");
      const pointData = await this.fetchPoints();
      const stationUrl = pointData.properties.observationStations;
      const firstStation = await this.fetchFirstStation(stationUrl);
      this.stationName = firstStation.properties.name;
      const currentUrl = `https://api.weather.gov/stations/${firstStation.properties.stationIdentifier}/observations/latest`;
      this.fetchCurrent(currentUrl);

      const hourlyUrl = pointData.properties.forecast;
      this.fetchHourly(hourlyUrl);
      this.loaded = true;
    },

    async fetchCurrent(url) {
      try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Current Weather Data:", data);
        const temperatureC = data.properties.temperature.value;
        const temperatureF = Math.round((temperatureC * 9) / 5 + 32);
        const feelsLikeC = this.calculateFeelsLikeTempC(
          temperatureC,
          data.properties.dewpoint.value
        );
        const feelsLikeF = Math.round((feelsLikeC * 9) / 5 + 32);
        // Map data properties accordingly.
        // The object structure from api.weather.gov may contain nested properties;
        // Adjust these mappings per the actual API response.
        this.current = {
          description: data.properties.textDescription || "No description",
          temperatureF: data.properties.temperature.value
            ? Math.round(temperatureF) + "°F"
            : "--°F",
          temperatureC: data.properties.temperature.value
            ? Math.round(temperatureC) + "°C"
            : "--°C",
          feels_like: feelsLikeF ? Math.round(feelsLikeF) + "°F" : "--°F",
          wind_speed: data.properties.windSpeed.value
            ? Math.round(data.properties.windSpeed.value) + " mph"
            : "-- mph",
          wind_direction: data.properties.windDirection.value
            ? data.properties.windDirection.value + "°"
            : "",
          wind_gust: data.properties.windGust.value
            ? Math.round(data.properties.windGust.value) + " mph"
            : "-- mph",
          air_quality: "Good", // Placeholder value. Replace with actual air quality data if available.
          icon: data.properties.icon || "",
        };
      } catch (error) {
        console.error("Error fetching current weather:", error);
        this.current.description = "Error loading weather";
      }
    },

    async fetchHourly(url) {
      try {
        const res = await fetch(url);
        const data = await res.json();
        // Process the hourly forecast features array.
        // Here we assume the response includes an array of periods.
        this.forecast = data.properties.periods.map((period) => {
          // Create a short time string using the ISO time string.
          const date = new Date(period.startTime);
          return {
            time: period.startTime,
            icon: period.icon,
            name: period.name,
            shortForecast:
              period.shortForecast.length < 55
                ? period.shortForecast
                : period.shortForecast.substring(0, 55) + "...",
            shortTime: date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            temperature: period.temperature
              ? period.temperature + "°F"
              : "--°F",
            // Include additional properties if needed.
          };
        });
      } catch (error) {
        console.error("Error fetching hourly forecast:", error);
      }
    },
  };
}
