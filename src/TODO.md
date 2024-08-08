# TODO
- event timer 
    - przypominanie o eventach
- achievs 
    - planowanie wg zysku/pracochłonności/kosztów
    - w todo sortowanie po ilości ap i postępie malejąco
    - brakuje achievs (np. rift hunting vs https://wiki.guildwars2.com/wiki/Rift_Hunting_(achievements)). Napisać skrypcik do wyciągania różnic pomiędzy api a wiki i użyć wyniku do wypeniania luk
    - sortowanie w /achievements  wywołuje się bez sensu dla każdej kategorii (czyli np. 188 razy...)
    - dodać listę niestandardowych linków do wiki, np. w achieves często zamiast "xxx" mamy "xxx_(achievements)"
    - rozróżniać achiev czasowe, np. dragon bash, halloween itp. i je odpowiednio ukrywać
    
- trading post
    + trading post delivery

- colors (dyes)

+ handle 403 errors
- pvp
+ przenieść ładowanie ustawień z poszczególnych stron do load w js
- wydzielić więcej komponentów wizualnych
- refaktoring apiservice by zajmowało się tylko api, a dodać nową warstwę do mapowania i zwracania obiektów dla frontu
- autotooltip:
    - nie inicjuje się prawidłowo. Nie czeka na załadowanie całej strony. Część strony potrafi miec autotooltip, a reszta oryginalny. 
    - przy filtrowaniu dochodzi do sytuacji, gdzie są da tooltipy do jednej pozycji pokazujące co innego (autotooltip pokazuje tooltip pozycji, która byłą w tym miejscu przed filtrowaniem)
- podanie klucza powoduje jego natychmiastowy zapis, zamiast poczekać na potwierdzenie, że jest poprawny
+ jeśli w api zapiamiętany jest niepoprawny klucz (mógł zostać unieważniony), to aplikacja jest całkowicie nieużywalna. Można ją naprawić jedynie usuwając klucz z poziomu devTools
