function weatherApp() {
  return {
    current: {
      description: "Loading...",
      temperature: "--°F",
      feels_like: "--°F",
      wind_speed: "-- mph",
      wind_direction: "",
      wind_gust: "-- mph",
      air_quality: "N/A",
    },
    forecast: [],

    init() {
      // Check for CORS issues in development and secure endpoints in production.
      // These endpoints use a sample gridpoint. You may wish to update these coordinates.
      const currentUrl =
        "https://api.weather.gov/stations/KAVP/observations/latest";
      const hourlyUrl = "https://api.weather.gov/gridpoints/BGM/65,32/forecast";

      this.fetchCurrent(currentUrl);
      this.fetchHourly(hourlyUrl);
    },

    async fetchCurrent(url) {
      try {
        const res = await fetch(url);
        const data = await res.json();

        // Map data properties accordingly.
        // The object structure from api.weather.gov may contain nested properties;
        // Adjust these mappings per the actual API response.
        this.current = {
          description: data.properties.textDescription || "No description",
          temperature: data.properties.temperature.value
            ? Math.round(data.properties.temperature.value) + "°F"
            : "--°F",
          feels_like: data.properties.dewpoint.value
            ? Math.round(data.properties.dewpoint.value) + "°F"
            : "--°F",
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
