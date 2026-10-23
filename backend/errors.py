class ServiceError(Exception):
    """An outside service (Cohere, ElevenLabs, speech model) failed.

    `message` is safe to show to the user. main.py turns this into an
    HTTP error response, so routes don't need try/except everywhere.
    """

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code