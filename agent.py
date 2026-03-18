import logging
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import cli, JobContext, WorkerOptions, AgentSession, RoomInputOptions
from livekit.plugins import google, noise_cancellation

from prompts import AGENT_INSTRUCTION, SESSION_INSTRUCTION
from tools import get_weather, search_web, send_email

load_dotenv()
logging.basicConfig(level=logging.DEBUG)

class Assistant(agents.Agent):
    def __init__(self):
        super().__init__(
            instructions=AGENT_INSTRUCTION,
            llm=google.beta.realtime.RealtimeModel(voice="Aoede", temperature=0.8),
            tools=[get_weather, search_web, send_email]
        )

async def entrypoint(ctx: JobContext):
    session = AgentSession()
    
    room_input_options = RoomInputOptions(
        video_enabled=True, 
        noise_cancellation=noise_cancellation.BVC()
    )
    
    session.start(
        room=ctx.room, 
        agent=Assistant(), 
        room_input_options=room_input_options
    )
    
    await ctx.connect()
    
    await session.generate_reply(instructions=SESSION_INSTRUCTION)
    
    ctx.add_shutdown_callback(lambda: session.stop())

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
