import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

public class LuneverseLoginTest {
    public static void main(String[] args) {
        System.setProperty("webdriver.chrome.driver", "C:\\chromedriver\\chromedriver.exe");

        WebDriver driver = new ChromeDriver();

        driver.get("http://localhost:5173/login");

        driver.findElement(By.id("email")).sendKeys("test@example.com");
        driver.findElement(By.id("password")).sendKeys("yourPassword");
        driver.findElement(By.cssSelector("button[type='submit']")).click();

        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        String actualUrl = driver.getCurrentUrl();
        String expectedUrl = "http://localhost:5173/dashboard";

        if (actualUrl.equalsIgnoreCase(expectedUrl)) {
            System.out.println("✅ Test passed: Login redirected correctly!");
        } else {
            System.out.println("❌ Test failed. Actual URL: " + actualUrl);
        }

        driver.quit();
    }
}
