
import pytest
from app.utils.analytics import normalize_referrer, get_country_code, get_client_ip
from unittest.mock import patch, MagicMock

class TestAnalyticsUtils:
    def test_normalize_referrer(self):
        assert normalize_referrer("https://www.google.com/search?q=test") == "google.com"
        assert normalize_referrer("https://sub.example.co.uk/path") == "sub.example.co.uk"
        assert normalize_referrer("http://localhost:3000") == "localhost:3000"
        assert normalize_referrer("") is None
        assert normalize_referrer(None) is None
        assert normalize_referrer("not-a-url") is None

    @patch("requests.get")
    def test_get_country_code_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "success", "countryCode": "US"}
        mock_get.return_value = mock_response
        
        assert get_country_code("8.8.8.8") == "US"
        mock_get.assert_called_with("http://ip-api.com/json/8.8.8.8?fields=status,countryCode", timeout=2)

    @patch("requests.get")
    def test_get_country_code_fail(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response
        
        assert get_country_code("8.8.8.8") is None

    def test_get_country_code_local(self):
        assert get_country_code("127.0.0.1") == "Local"
        assert get_country_code("localhost") == "Local"

    def test_get_client_ip(self):
        # Mock Request object
        request = MagicMock()
        
        # Scenario 1: Cloudflare header exists
        request.headers = {"cf-connecting-ip": "1.1.1.1"}
        assert get_client_ip(request) == "1.1.1.1"
        
        # Scenario 2: X-Forwarded-For exists
        request.headers = {"x-forwarded-for": "2.2.2.2, 3.3.3.3"}
        assert get_client_ip(request) == "2.2.2.2"
        
        # Scenario 3: Prioritize CF over XFF
        request.headers = {
            "cf-connecting-ip": "1.1.1.1",
            "x-forwarded-for": "2.2.2.2"
        }
        assert get_client_ip(request) == "1.1.1.1"
        
        # Scenario 4: Fallback to request.client.host
        request.headers = {}
        request.client.host = "4.4.4.4"
        assert get_client_ip(request) == "4.4.4.4"
