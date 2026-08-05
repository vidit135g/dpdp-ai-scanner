"""
sample_app.py
A small, deliberately mixed example app used to validate the scanner:
  - one HIGH risk call (customer email sent straight to OpenAI)
  - one HIGH risk call (data pulled from a Flask request into Anthropic)
  - one MEDIUM risk call (generic variable name, ambiguous)
  - one LOW risk call (static system prompt, no user data)
"""

import openai
import anthropic
from flask import request


def summarize_support_ticket(customer_email, ticket_body):
    """HIGH risk: customer_email is clearly PII, sent directly to OpenAI."""
    prompt_text = f"Customer: {customer_email}\nTicket: {ticket_body}"
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt_text}],
    )
    return response


def handle_chat_request():
    """HIGH risk: payload pulled straight from an incoming Flask request."""
    user_message = request.json.get("message")
    client = anthropic.Anthropic()
    result = client.messages.create(
        model="claude-3-opus-20240229",
        messages=[{"role": "user", "content": user_message}],
    )
    return result


def generate_report_summary(data):
    """MEDIUM risk: generic variable name, needs a human to check."""
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": data}],
    )
    return response


def get_style_suggestions():
    """LOW risk: static system prompt, no user data involved."""
    system_prompt = "You are a helpful assistant that suggests writing styles."
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": system_prompt}],
    )
    return response
