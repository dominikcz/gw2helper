# edytor receptur

Ponieważ mamy spore trudności z automatycznym zbudowaniem definicji receptur zastosujemy inne podejście, które przy okazji ułatwi weryfikację poprawności.

Przygotuj mi nową stronę /recipies, która będzie służyłą za edytor receptur. Zasada działania:

1. Nie potrzebuję by ta strona była publicznie dostępna po buildzie statycznym. Wystarczy, że będzie dostepna do odpalania lokalnie za pomocą `npm run dev`
2. Trzeba najpierw pobrać dane wszystkich itemów i zapisać w cache
3. Potrzebuję zobaczyć listę wszystkich dostepnych przedmiotów wraz z obrazkami, nazwą itd. na podstawie danych z api - standardowa prezentacja za pomocą ItemLabel
4. Przedmiotów będzie kilkadziesiąt tysięcy wiec nie ładuj wszystkiego do pamięci, pokazuj max pierwszych 1000 pozycji pasujacych do filtra
5. Interfejs powinien dawać możliwość wyszukiwania po fragmencie nazwy i opcjonalnie rarity
6. dla każdej pozycji powinien pokazywać czy ma już recepturę w folderze /static/data/recipies
7. jeśli nie ma to przycisk do tworzenia nowej, a jeśli ma to do edycji
8. edycja/tworzenie nowej:
   1. przycisk do próby automatycznego pobrania danych z wiki (tylko 1 poziom)
   2. dla pełnego obrazu przy scrappingu z wiki pamiętaj o pobraniu wcześniej listy currencies i trzymaniu w cache
   3. ręczna edycja składników
   4. zapis na dysku
   5. ten zapis powinien jużdawać możliwość ustawienia pól, któych w api nie było, jak np. koszt w różnych walutach poza złotem
9. To użytkownik decyduje czy pobierać głębiej czy nie.
10. Jeśli będzie chciał rozwinąć dany składnik to ma to działąć analogicznie jak na stronie startowej, z tą różnicą, że już nie mamy listy, tylko jeden element
11. po uzupełnieniu wracamy o poziom wyżej
12. cały czas powinien być dostepny breadcrumb umożliwiający szybką nawigację
