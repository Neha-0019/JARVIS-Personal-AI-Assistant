import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
import requests
from livekit.agents import function_tool

# Using a class based approach is standard for livekit tools, but let's use the requested approach if possible, or just standard ai_callable.
from langchain_community.tools.ddg_search.tool import DuckDuckGoSearchRun

# Function tool is not a standard LiveKit class, we use llm.ai_callable on functions
@function_tool()
async def get_weather(context, city: str) -> str:
    """Gets current weather for a city."""
    try:
        geocode_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json"
        geo_response = requests.get(geocode_url)
        geo_data = geo_response.json()
        
        if not geo_data.get("results"):
            return f"Could not find coordinates for {city}."
            
        lat = geo_data["results"][0]["latitude"]
        lon = geo_data["results"][0]["longitude"]
        
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        weather_response = requests.get(weather_url)
        weather_data = weather_response.json()
        
        if "current_weather" not in weather_data:
            return f"Could not get weather data for {city}."
            
        temp = weather_data["current_weather"]["temperature"]
        windspeed = weather_data["current_weather"]["windspeed"]
        
        return f"The current weather in {city} is {temp}°C with {windspeed} km/h wind."
        
    except Exception as e:
        return f"Failed to get weather for {city}: {str(e)}"

@function_tool()
async def search_web(context, query: str) -> str:
    """Searches the web using DuckDuckGo."""
    try:
        search_tool = DuckDuckGoSearchRun()
        result = search_tool.run(tool_input=query)
        return result
    except Exception as e:
        return f"Search failed: {str(e)}"

@function_tool()
async def send_email(context, to_email: str, subject: str, message: str, cc_email: Optional[str] = None) -> str:
    """Sends an email via Gmail SMTP."""
    try:
        gmail_user = os.environ.get("GMAIL_USER")
        gmail_password = os.environ.get("GMAIL_APP_PASSWORD")
        
        if not gmail_user or not gmail_password:
            return "Failed: GMAIL_USER or GMAIL_APP_PASSWORD not set."
            
        msg = MIMEMultipart()
        msg['From'] = gmail_user
        msg['To'] = to_email
        msg['Subject'] = subject
        if cc_email:
            msg['Cc'] = cc_email
            
        msg.attach(MIMEText(message, 'plain'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        
        try:
            server.login(gmail_user, gmail_password)
        except smtplib.SMTPAuthenticationError:
            server.quit()
            return "Authentication error check GMAIL_USER and GMAIL_APP_PASSWORD."
            
        recipients = [to_email]
        if cc_email:
            recipients.append(cc_email)
            
        server.sendmail(gmail_user, recipients, msg.as_string())
        server.quit()
        
        return f"Email sent successfully to {to_email}."
        
    except Exception as e:
        return f"Failed to send email: {str(e)}"
