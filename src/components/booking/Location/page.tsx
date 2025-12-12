"use client";
import React from "react";
import useOnclickOutside from "react-cool-onclickoutside";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

interface LocationInputProps {
  value?: string;
  onLocationSelect: (location: {
    address: string;
    geo_location: { type: "Point"; coordinates: [number, number] };
  }) => void;
  onBlur?: () => void;
}

const LocationInput: React.FC<LocationInputProps> = ({ value = "", onLocationSelect, onBlur }) => {
  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    callbackName: "shootBook",
    requestOptions: {},
    debounce: 300,
  });

  React.useEffect(() => {
    if (value !== inputValue) setValue(value, false);
    // eslint-disable-next-line
  }, [value]);

  const handleLocationSelect =
    (suggestion: any) =>
    () => {
      const { description } = suggestion;
      setValue(description, false);
      clearSuggestions();
      getGeocode({ address: description }).then((results) => {
        const { lat, lng } = getLatLng(results[0]);
        onLocationSelect({
          address: description,
          geo_location: {
            type: "Point",
            coordinates: [lng, lat],
          },
        });
      });
    };

  const renderSuggestions = () =>
    data.map((suggestion) => {
      const {
        place_id,
        structured_formatting: { main_text, secondary_text },
      } = suggestion;

      return (
        <li
          key={place_id}
          onClick={handleLocationSelect(suggestion)}
          className="py-1"
        >
          <strong>{main_text}</strong> <small>{secondary_text}</small>
        </li>
      );
    });

  const ref = useOnclickOutside(() => {
    clearSuggestions();
  });

  return (
    <div className="flex items-center rounded-lg w-full relative">
      <div className="flex items-start rounded-[32px] w-full">
        <div ref={ref} className=" w-full">
          <input
            value={inputValue}
            onChange={(e) => setValue(e.target.value)}
            onBlur={onBlur}
            disabled={!ready}
            placeholder="Where would you like to shoot?"
            className="text-gray-coolGray500 text-[16px] bg-white dark:bg-black border-gray-coolGray200 outline-none rounded-s-lg w-full focus:ring-gray-coolGray400 focus:border-gray-coolGray400 rounded-e-lg"
          />
          {status === "OK" && (
            <ul
              className="location-scearch absolute bg-white z-40 w-full shadow-lg rounded-lg"
              style={{ padding: "0px 15px" }}
            >
              {renderSuggestions()}
            </ul>
          )}
        </div>
        {/* <select className="text-gray-coolGray500 text-base bg-white dark:bg-black border-gray-coolGray200 outline-none w-32 rounded-e-lg focus:ring-gray-coolGray400 focus:border-gray-coolGray400">
          <option value="NYC">NYC</option>
          <option value="LA">LA</option>
        </select> */}
      </div>
    </div>
  );
};

export default LocationInput;