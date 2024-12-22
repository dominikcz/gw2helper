# TODO
- event timer 
    - pomyśleć jednak o jakiejś formie sticky dla godzin
        
- achievs 
    - planowanie wg zysku/pracochłonności/kosztów
    - w todo sortowanie po ilości ap i postępie malejąco
    - brakuje achievs (np. rift hunting vs https://wiki.guildwars2.com/wiki/Rift_Hunting_(achievements)). Napisać skrypcik do wyciągania różnic pomiędzy api a wiki i użyć wyniku do wypeniania luk.
    - dodać listę niestandardowych linków do wiki, np. w achieves często zamiast "xxx" mamy "xxx_(achievements)"
    + rozróżniać achiev czasowe, np. dragon bash, halloween itp. i je odpowiednio ukrywać. Na razie tylk ręcznie...
    - nie działa prawidłowo ładowanie bits_done
    - dodać tooltip z komponentem dla różnych typów bits. Przykłady: 
        - https://api.guildwars2.com/v2/achievements/6333
        - https://api.guildwars2.com/v2/achievements/6344
        - https://api.guildwars2.com/v2/achievements/7802
            - https://api.guildwars2.com/v2/skins/12030
            ...
        - https://api.guildwars2.com/v2/achievements/5188
            - https://api.guildwars2.com/v2/minis/806
            - https://api.guildwars2.com/v2/minis/809
            ...

    - czasem nie pokazują się prawidłowo wartośći postępu w bitsDone
    - wyswietlanie postępu działa w miarę sensownie tylko dla achievement.type == "Default". asowałoby obsłużyć type == "ItemSet"


x colors (dyes) - miałoby moze sens pokazanie wyglądu w 3D na różnyh materiałach.. ale nie wiem czy warto

+ handle 403 errors
- pvp
+ przenieść ładowanie ustawień z poszczególnych stron do load w js
- wydzielić więcej komponentów wizualnych
- refaktoring apiservice by zajmowało się tylko api, a dodać nową warstwę do mapowania i zwracania obiektów dla frontu

- zaimplementować [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) jeśli są aktywne powiadomienia
- dodać możliwość rejestrowania poiadomień na konkretną godzinę bezpośrednio z widoku /events. Może użyć do tego akcji?
- dodać sekcję legendary armor/weapons?
+ dodać sekcję trading post (transactions)?
- na stronie daily powinna się znaleźć lista todo z achievements, ale ograniczona do daily i weekly
- cache do items ignoruje język, więc można zobaczyć opisy z innego języka 😒

- trading post powinien pokazywać dodatkowo aktualną sytuację rynkową, czyli najbardziej konkurencyjną ofertę kupna/sprzedaży danego przedmiotu w stosunku do mojej oferty
